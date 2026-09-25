/*
 * button_gesture.h - portable push-button gesture decoder.
 *
 * Feed it the raw button level and a millisecond timestamp (from a 1 ms
 * tick or on every edge interrupt plus periodic polling). It reports:
 *   single / double / triple tap, hold 1 s, hold 3 s, hold 5 s,
 *   plus "progress" events when a held press crosses 1 s / 3 s / 5 s
 *   (useful for LED feedback while the user is still holding).
 *
 * No hardware dependencies; unit tested on the host (see test/).
 */
#ifndef BUTTON_GESTURE_H
#define BUTTON_GESTURE_H

#include <stdbool.h>
#include <stdint.h>

typedef enum {
    BTN_EVT_NONE = 0,
    BTN_EVT_SINGLE_TAP,
    BTN_EVT_DOUBLE_TAP,
    BTN_EVT_TRIPLE_TAP,     /* 3 or more taps (count in event.taps) */
    BTN_EVT_HOLD_1S,        /* released after 1 s .. 3 s            */
    BTN_EVT_HOLD_3S,        /* released after 3 s .. 5 s            */
    BTN_EVT_HOLD_5S,        /* fired while still held, at 5 s       */
    BTN_EVT_PROGRESS_1S,    /* still held, crossed 1 s              */
    BTN_EVT_PROGRESS_3S,    /* still held, crossed 3 s              */
} btn_event_type_t;

typedef struct {
    btn_event_type_t type;
    uint8_t taps;           /* number of taps for tap events */
} btn_event_t;

typedef struct {
    uint16_t debounce_ms;   /* ignore level changes shorter than this   */
    uint16_t tap_max_ms;    /* press shorter than this counts as a tap  */
    uint16_t tap_gap_ms;    /* max release gap between taps of a series */
    uint16_t hold1_ms;
    uint16_t hold3_ms;
    uint16_t hold5_ms;
} btn_config_t;

#define BTN_CONFIG_DEFAULT { 20u, 350u, 400u, 1000u, 3000u, 5000u }

typedef struct {
    btn_config_t cfg;
    bool     stable;        /* debounced level: true = pressed          */
    bool     raw;
    uint32_t raw_since;
    uint32_t press_start;
    uint32_t release_time;
    uint8_t  taps;
    uint8_t  progress;      /* 0, 1 (1 s sent), 3 (3 s sent), 5 (5 s sent) */
    bool     ignore_until_release;
} btn_gesture_t;

/* start_pressed: pass true if the button is already held at boot
 * (e.g. the press that just switched the latch on) so that press is ignored. */
void btn_init(btn_gesture_t *b, const btn_config_t *cfg, bool start_pressed, uint32_t now_ms);

/* Call often (every 1..10 ms while awake, and on every edge).
 * Returns at most one event per call; call again until BTN_EVT_NONE if needed. */
btn_event_t btn_update(btn_gesture_t *b, bool pressed, uint32_t now_ms);

/* True while a gesture is still being decoded (pressed, or waiting for more
 * taps). Don't enter a low-power mode while this is true. */
bool btn_busy(const btn_gesture_t *b);

#endif
