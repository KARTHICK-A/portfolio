#!/bin/sh
# Download the datasheets listed in README.md into this folder.
# Some vendor sites block scripted downloads; if a file is not a PDF, save it from a browser.
set -u
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
get() {
    printf '%-40s ' "$1"
    if curl -fsSL -A "$UA" --max-time 60 -o "$1" "$2" && head -c 4 "$1" | grep -q '%PDF'; then
        echo ok
    else
        echo "FAILED - open manually: $2"; rm -f "$1"
    fi
}
get STM6601_datasheet.pdf        https://www.st.com/resource/en/datasheet/stm6601.pdf
get STM6600_STM6601_AN3271.pdf   https://www.st.com/resource/en/application_note/an3271-using-the-stm6600-stm6601-smart-pushbutton-onoff-controller-stmicroelectronics.pdf
get STM32L031K6_datasheet.pdf    https://www.st.com/resource/en/datasheet/stm32l031k6.pdf
get TPS7A05_datasheet.pdf        https://www.ti.com/lit/ds/symlink/tps7a05.pdf
get MCP73831_datasheet.pdf       https://ww1.microchip.com/downloads/en/DeviceDoc/MCP73831-Family-Data-Sheet-DS20001984H.pdf
get MAX16150_datasheet.pdf       https://www.analog.com/media/en/technical-documentation/data-sheets/MAX16150.pdf
get LTC2955_datasheet.pdf        https://www.analog.com/media/en/technical-documentation/data-sheets/2955fa.pdf
get TPS3422_datasheet.pdf        https://www.ti.com/lit/ds/symlink/tps3422.pdf
echo "RM0377 (STM32L0x1 reference manual): download from st.com, search 'RM0377'."
