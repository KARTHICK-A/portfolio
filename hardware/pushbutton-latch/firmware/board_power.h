/*
 * board_power.h - power modes for the STM6601 + STM32L031K6 board.
 *
 * Pin map (matches hardware/pushbutton_latch.kicad_sch):
 *   PA0  BTN_N       STM6601 ~PB_OUT (open drain, 100k pull-up) - low while pressed.
 *                    EXTI0 for Stop wake-up, SYS_WKUP1 for Standby wake-up.
 *   PA1  PS_HOLD     STM6601 PS_HOLD (100k pull-up to 3V3). Drive LOW = power OFF.
 *   PA2  INT_N       STM6601 ~INT (open drain, 100k pull-up)
 *   PA3  VBAT_LOW_N  STM6601 ~VCC_LO (open drain, 100k pull-up) - low = battery low
 *   PA4  LED_STAT    green status LED (active high)
 *   PA5  VBAT_SENSE  ADC_IN5, VBAT/2 (4.7M/4.7M from latch EN)
 *
 * Modes:
 *   RUN         normal operation
 *   SLEEP       STM32 Stop mode: RAM + registers kept, wakes on button edge
 *               (EXTI0) in microseconds and resumes where it stopped.
 *   DEEP SLEEP  STM32 Standby: RAM lost, wakes on WKUP1 (PA0) and restarts
 *               from reset. Lowest MCU current while the latch stays ON.
 *   OFF         PS_HOLD low -> STM6601 drops EN -> LDO off -> MCU unpowered.
 *               Only the STM6601 standby current remains. Press the button to
 *               power on again.
 */
#ifndef BOARD_POWER_H
#define BOARD_POWER_H

#include <stdbool.h>
#include <stdint.h>

typedef enum { BOOT_POWER_ON, BOOT_FROM_STANDBY } boot_reason_t;

boot_reason_t board_power_init(void);      /* call first thing after HAL_Init() */
bool          board_button_pressed(void);
bool          board_battery_low(void);
uint32_t      board_vbat_mv(void);         /* approximate, see note in .c */
void          board_led(bool on);

void board_sleep(void);        /* Stop mode, returns after wake-up  */
void board_deep_sleep(void);   /* Standby, never returns (reset)    */
void board_power_off(void);    /* never returns                     */

#endif
