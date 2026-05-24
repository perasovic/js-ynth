<div class="control-block">
    <div class="title">{title}</div>
    <div class="value-area">
        {#if iconClassMap[displayedValue]}
            <span class="icon--tabler {iconClassMap[displayedValue]}"></span>
        {:else}
            <span class="value-display">{displayedValue}</span>
            {#if unit}<span class="unit">{unit}</span>{/if}
        {/if}
    </div>
    {#if enableInverse}
        <button class="inverseButton" class:useInverse on:click={() => {useInverse = !useInverse}}>⅟</button>
    {/if}
    <div class="button-column">
        <button class="stepButton up" on:pointerdown|self={stepUpClicked}>▲</button>
        <button class="stepButton down" on:pointerdown|self={stepDownClicked}>▼</button>
    </div>
    <div class="knob-wrapper">
        <div class="knob" style="--rotation: {rotation}" on:pointerdown|self={knobClicked}></div>
    </div>
</div>

<script>
    import { onDestroy } from 'svelte';

    export let value, min, max;
    export let rotRange = 2 * Math.PI * 0.83;
    export let pixelRange = 200;
    export let startRotation = -Math.PI * 0.83;
    export let title = '';
    export let unit = '';
    export let outputValue = null;
    export let enableInverse = false;
    export let useInverse = false;

    let startY, startValue, stepButtonDown, stepButtonTimeout;
    let displayedValue;
    let stopScrolling = false;

    const iconClassMap = {
        'sine': 'icon--tabler--wave-sine',
        'triangle': 'icon--tabler--wave-triangle',
        'sawtooth': 'icon--tabler--wave-saw-tool',
        'square': 'icon--tabler--wave-square'
    };

    $: valueRange = max - min;
    $: rotation = startRotation + (value - min) / valueRange * rotRange;
    $: displayedValue = outputValue ?? (useInverse ? round(1/value) : value);

    // avoid scrolling on mobile devices
    window.addEventListener('touchmove', preventTouchMove, { passive: false });

    onDestroy(() => {
        window.removeEventListener('touchmove', preventTouchMove);
    });

    function round(num) {
        return num.toFixed(3);
    }

    function clamp(num, min, max) {
        return Math.round(Math.max(min, Math.min(num, max)));
    }

    function knobClicked({ clientY }) {
        startY = clientY;
        startValue = value;
        window.addEventListener('pointermove', knobMoved);
        window.addEventListener('pointerup', knobReleased);
        stopScrolling = true;
    }

    function knobMoved(event) {
        const { clientY } = event;
        const valueDiff = valueRange * (clientY - startY) / pixelRange;
        value = clamp(startValue - valueDiff, min, max);
    }

    function knobReleased() {
        window.removeEventListener('pointermove', knobMoved);
        window.removeEventListener('pointerup', knobReleased);
        stopScrolling = false;
    }

    function preventTouchMove(event) {
        if (stopScrolling) {
            event.preventDefault();
        }
    }

    function stepUpClicked() {
        stepButtonDown = true;
        stepUp();
        window.addEventListener('pointerup', stepReleased);
    }

    function stepDownClicked() {
        stepButtonDown = true;
        stepDown();
        window.addEventListener('pointerup', stepReleased);
    }

    function stepReleased() {
        stepButtonDown = false;
        clearTimeout(stepButtonTimeout);
        window.removeEventListener('pointerup', stepReleased);
    }

    function stepUp() {
        if (stepButtonDown && value < max){
            value = value + 1;
            stepButtonTimeout = setTimeout(stepUp, 300);
        }
    }

    function stepDown() {
        if (stepButtonDown && value > min){
            value = value - 1;
            stepButtonTimeout = setTimeout(stepDown, 300);
        }
    }
</script>


<style>
    .control-block {
        display: grid;
        grid-template-columns: 50px 24px 44px;
        grid-template-rows: 16px 52px;
        gap: 2px 6px;
        padding: 6px 8px;
        background-color: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-width: 140px;
        max-width: 150px;
        position: relative;
    }

    .title {
        grid-column: 1 / -1;
        grid-row: 1;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #888;
        letter-spacing: 0.5px;
        line-height: 1;
    }

    .value-area {
        grid-column: 1;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .value-display {
        font-size: 1rem;
        font-weight: 700;
        color: #ff3e00;
        line-height: 1;
    }

    .icon--tabler {
        width: 1.8em;
        height: 1.8em;
        color: #ff3e00;
    }

    .unit {
        font-size: 0.65rem;
        color: #999;
        line-height: 1;
    }

    .button-column {
        grid-column: 2;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        gap: 2px;
        justify-content: center;
    }

    .stepButton {
        color: #999;
        font-size: 0.7rem;
        border: 0.5px solid #ccc;
        background: white;
        height: 20px;
        width: 20px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 1px;
        line-height: 1;
    }

    .stepButton.up {
        padding-bottom: 2px;
    }

    .stepButton.down {
        padding-top: 2px;
    }

    .stepButton:hover {
        color: #ff3e00;
        border-color: #ff3e00;
        background-color: #fff3f0;
    }

    .stepButton:active {
        background-color: #ff3e00;
        border-color: #ff3e00;
        color: white;
    }

    .knob-wrapper {
        grid-column: 3;
        grid-row: 2;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .knob {
        display: block;
        width: 44px;
        height: 44px;
        padding: 0;
        border-radius: 50%;
        background-image: conic-gradient(white 0%, white 4%, #ff3e00 4%, #ff3e00 96%, white 96%, white 100%);
        transform: rotate(calc(var(--rotation) * 1rad));
        transform-origin: 50% 50%;
        cursor: ns-resize;
    }

    .inverseButton {
        grid-column: 3;
        grid-row: 1;
        justify-self: end;
        align-self: start;
        color: #ff3e00;
        font-size: 0.6rem;
        border: 1px solid #ff3e00;
        background: white;
        height: 16px;
        width: 18px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 2px;
        margin-top: -2px;
        margin-right: -2px;
    }

    .inverseButton:hover {
        background-color: #fff3f0;
    }

    .useInverse {
        color: #ffffff;
        background-color: #ff3e00;
    }
</style>

