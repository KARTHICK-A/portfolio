/* Host unit test: gcc -I.. ../button_gesture.c test_gesture.c -o t && ./t */
#include <stdio.h>
#include <string.h>
#include "button_gesture.h"

static int fails;
static btn_gesture_t b;
static uint32_t now;
static btn_event_type_t log_[32];
static int nlog;

static void run(bool pressed, uint32_t ms)       /* hold level for ms, 1 ms steps */
{
    for (uint32_t i = 0; i < ms; i++, now++) {
        btn_event_t e = btn_update(&b, pressed, now);
        if (e.type != BTN_EVT_NONE && nlog < 32) log_[nlog++] = e.type;
    }
}

static void start(bool held) { now = 1000; nlog = 0; btn_init(&b, NULL, held, now); }

static void expect(const char *name, const btn_event_type_t *want, int n)
{
    int ok = (n == nlog) && memcmp(want, log_, n * sizeof *want) == 0;
    printf("%-34s %s\n", name, ok ? "PASS" : "FAIL");
    if (!ok) {
        fails++;
        printf("   got:");
        for (int i = 0; i < nlog; i++) printf(" %d", log_[i]);
        printf("\n");
    }
}
#define EXPECT(name, ...) do { btn_event_type_t w[] = { __VA_ARGS__ }; expect(name, w, sizeof w / sizeof *w); } while (0)
#define EXPECT_NONE(name) expect(name, NULL, 0)

int main(void)
{
    start(false); run(1, 100); run(0, 600);
    EXPECT("single tap", BTN_EVT_SINGLE_TAP);

    start(false); run(1, 100); run(0, 200); run(1, 120); run(0, 600);
    EXPECT("double tap", BTN_EVT_DOUBLE_TAP);

    start(false); for (int i = 0; i < 3; i++) { run(1, 100); run(0, 200); } run(0, 600);
    EXPECT("triple tap", BTN_EVT_TRIPLE_TAP);

    start(false); run(1, 1500); run(0, 600);
    EXPECT("hold 1 s", BTN_EVT_PROGRESS_1S, BTN_EVT_HOLD_1S);

    start(false); run(1, 3500); run(0, 600);
    EXPECT("hold 3 s", BTN_EVT_PROGRESS_1S, BTN_EVT_PROGRESS_3S, BTN_EVT_HOLD_3S);

    start(false); run(1, 6000); run(0, 600);
    EXPECT("hold 5 s fires while held", BTN_EVT_PROGRESS_1S, BTN_EVT_PROGRESS_3S, BTN_EVT_HOLD_5S);

    start(false); run(1, 600); run(0, 600);
    EXPECT_NONE("0.6 s press ignored");

    start(false); for (int i = 0; i < 5; i++) { run(1, 3); run(0, 3); } run(0, 600);
    EXPECT_NONE("bounce < debounce ignored");

    start(true); run(1, 2000); run(0, 600);
    EXPECT_NONE("power-on press ignored");

    start(true); run(1, 300); run(0, 100); run(1, 100); run(0, 600);
    EXPECT("tap after power-on press", BTN_EVT_SINGLE_TAP);

    start(false); run(1, 100); run(0, 200); run(1, 1200); run(0, 600);
    EXPECT("tap then hold -> hold only", BTN_EVT_PROGRESS_1S, BTN_EVT_HOLD_1S);

    start(false); run(1, 100); run(0, 500); run(1, 100); run(0, 600);
    EXPECT("slow taps = two singles", BTN_EVT_SINGLE_TAP, BTN_EVT_SINGLE_TAP);

    /* timer wrap-around */
    now = 0xFFFFFF00u; nlog = 0; btn_init(&b, NULL, false, now);
    run(1, 100); run(0, 200); run(1, 100); run(0, 600);
    EXPECT("double tap across tick wrap", BTN_EVT_DOUBLE_TAP);

    printf("\n%s (%d failures)\n", fails ? "FAILED" : "ALL PASSED", fails);
    return fails != 0;
}
