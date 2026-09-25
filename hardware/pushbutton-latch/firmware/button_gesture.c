#include "button_gesture.h"

static btn_event_t ev(btn_event_type_t t, uint8_t taps)
{
    btn_event_t e = { t, taps };
    return e;
}

void btn_init(btn_gesture_t *b, const btn_config_t *cfg, bool start_pressed, uint32_t now_ms)
{
    static const btn_config_t def = BTN_CONFIG_DEFAULT;
    b->cfg = cfg ? *cfg : def;
    b->stable = start_pressed;
    b->raw = start_pressed;
    b->raw_since = now_ms;
    b->press_start = now_ms;
    b->release_time = now_ms;
    b->taps = 0;
    b->progress = 0;
    b->ignore_until_release = start_pressed;
}

bool btn_busy(const btn_gesture_t *b)
{
    return b->stable || b->raw != b->stable || b->taps > 0;
}

static btn_event_t finish_taps(btn_gesture_t *b)
{
    uint8_t n = b->taps;
    b->taps = 0;
    if (n == 1) return ev(BTN_EVT_SINGLE_TAP, 1);
    if (n == 2) return ev(BTN_EVT_DOUBLE_TAP, 2);
    return ev(BTN_EVT_TRIPLE_TAP, n);
}

btn_event_t btn_update(btn_gesture_t *b, bool pressed, uint32_t now_ms)
{
    /* --- debounce --- */
    if (pressed != b->raw) {
        b->raw = pressed;
        b->raw_since = now_ms;
    }
    if (b->raw != b->stable && (uint32_t)(now_ms - b->raw_since) >= b->cfg.debounce_ms) {
        b->stable = b->raw;
        /* use the time the level actually changed, not when debounce ended */
        if (b->stable) {
            b->press_start = b->raw_since;
            b->progress = 0;
        } else {
            uint32_t held = b->raw_since - b->press_start;
            b->release_time = b->raw_since;
            if (b->ignore_until_release) {
                b->ignore_until_release = false;
                return ev(BTN_EVT_NONE, 0);
            }
            if (b->progress == 5) return ev(BTN_EVT_NONE, 0);       /* 5 s already reported */
            if (held < b->cfg.tap_max_ms) {
                if (b->taps < 255) b->taps++;
                return ev(BTN_EVT_NONE, 0);
            }
            b->taps = 0;                                          /* a hold ends any tap series */
            if (held >= b->cfg.hold3_ms) return ev(BTN_EVT_HOLD_3S, 0);
            if (held >= b->cfg.hold1_ms) return ev(BTN_EVT_HOLD_1S, 0);
            return ev(BTN_EVT_NONE, 0);                           /* 0.35 .. 1 s: ignored */
        }
    }

    if (b->ignore_until_release) return ev(BTN_EVT_NONE, 0);

    /* --- while held: progress + 5 s --- */
    if (b->stable) {
        uint32_t held = now_ms - b->press_start;
        if (b->progress < 5 && held >= b->cfg.hold5_ms) {
            b->progress = 5;
            b->taps = 0;
            return ev(BTN_EVT_HOLD_5S, 0);
        }
        if (b->progress < 3 && held >= b->cfg.hold3_ms) {
            b->progress = 3;
            return ev(BTN_EVT_PROGRESS_3S, 0);
        }
        if (b->progress < 1 && held >= b->cfg.hold1_ms) {
            b->progress = 1;
            if (b->taps) b->taps = 0;                             /* tap series abandoned */
            return ev(BTN_EVT_PROGRESS_1S, 0);
        }
        return ev(BTN_EVT_NONE, 0);
    }

    /* --- released: close a tap series after the gap --- */
    if (b->taps && (uint32_t)(now_ms - b->release_time) >= b->cfg.tap_gap_ms)
        return finish_taps(b);

    return ev(BTN_EVT_NONE, 0);
}
