/*
 * main_example.c - how the pieces fit together. Paste the body of main()
 * into the main.c that STM32CubeMX generates for the STM32L031K6.
 *
 * Default gesture map (change freely in handle_event()):
 *   power on       press the button (STM6601 latches the supply on)
 *   1 tap          user action A (example: toggle LED)
 *   2 taps         user action B
 *   3 taps         DEEP SLEEP  (Standby; button wakes it -> restart)
 *   hold 1 s       SLEEP       (Stop; any button press resumes)
 *   hold 3 s       user action C (example: pairing / settings)
 *   hold 5 s       OFF         (PS_HOLD low, latch releases the supply)
 *   hold ~10 s     hardware override by the STM6601 Smart Reset, works even
 *                  if the firmware has crashed (set by C4 = 1 uF)
 *   idle timeout   automatic SLEEP after IDLE_SLEEP_MS without activity
 *   battery low    ~VCC_LO asserted -> blink 3x then OFF
 */
#include "stm32l0xx_hal.h"
#include "board_power.h"
#include "button_gesture.h"

#define IDLE_SLEEP_MS  30000u

extern void SystemClock_Config(void);

static btn_gesture_t btn;
static uint32_t last_activity;

static void blink(int n)
{
    for (int i = 0; i < n; i++) { board_led(true); HAL_Delay(80); board_led(false); HAL_Delay(120); }
}

static void handle_event(btn_event_t e)
{
    last_activity = HAL_GetTick();
    switch (e.type) {
    case BTN_EVT_SINGLE_TAP:  HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_4); break;   /* action A */
    case BTN_EVT_DOUBLE_TAP:  blink(2); break;                                /* action B */
    case BTN_EVT_TRIPLE_TAP:  blink(3); board_deep_sleep(); break;
    case BTN_EVT_PROGRESS_1S: board_led(true); break;                         /* feedback */
    case BTN_EVT_HOLD_1S:     board_led(false); board_sleep();
                              btn_init(&btn, NULL, board_button_pressed(), HAL_GetTick());
                              break;
    case BTN_EVT_PROGRESS_3S: board_led(false); break;
    case BTN_EVT_HOLD_3S:     blink(4); break;                                /* action C */
    case BTN_EVT_HOLD_5S:     blink(5); board_power_off(); break;
    default: break;
    }
}

/* Wake the main loop on every button edge; decoding happens in the loop. */
void HAL_GPIO_EXTI_Callback(uint16_t pin) { (void)pin; }

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    boot_reason_t why = board_power_init();

    /* Power-on: the press that turned us on is probably still held -> ignore it.
     * From Standby: woken by the button; ignore a press still in progress too. */
    btn_init(&btn, NULL, board_button_pressed(), HAL_GetTick());
    blink(why == BOOT_POWER_ON ? 1 : 2);
    last_activity = HAL_GetTick();

    for (;;) {
        btn_event_t e = btn_update(&btn, board_button_pressed(), HAL_GetTick());
        if (e.type != BTN_EVT_NONE) handle_event(e);

        if (board_battery_low()) { blink(3); board_power_off(); }

        if (!btn_busy(&btn) && HAL_GetTick() - last_activity > IDLE_SLEEP_MS) {
            board_sleep();
            btn_init(&btn, NULL, board_button_pressed(), HAL_GetTick());
            last_activity = HAL_GetTick();
        }
        HAL_Delay(2);   /* 2 ms polling while awake; use __WFI + a timer for lower RUN current */
    }
}
