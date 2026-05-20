<span class="tooltip-container" bind:this={container}>
    <span class="tooltip-trigger" 
          on:click={toggle}
          on:keydown={handleKeydown}
          tabindex="0"
          role="button"
          aria-describedby={visible ? tooltipId : undefined}>
        <slot></slot>
    </span>
    <span id={tooltipId} class="tooltip-text" class:visible>{text}</span>
</span>

<script>
    import { onMount, onDestroy } from 'svelte';
    
    export let text = '';
    
    let visible = false;
    let container;
    let tooltipId = 'tooltip-' + Math.random().toString(36).substr(2, 9);
    
    function toggle(e) {
        e.preventDefault();
        e.stopPropagation();
        visible = !visible;
    }
    
    function handleKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle(e);
        }
        if (e.key === 'Escape') {
            visible = false;
        }
    }
    
    function handleOutsideClick(e) {
        if (visible && container && !container.contains(e.target)) {
            visible = false;
        }
    }
    
    onMount(() => {
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    });
    
    onDestroy(() => {
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
    });
</script>

<style>
    .tooltip-container {
        position: relative;
        display: inline-flex;
        cursor: help;
        border-bottom: 1px dashed #ff3e00;
    }

    .tooltip-trigger {
        display: inline-flex;
        outline: none;
    }

    .tooltip-trigger:focus-visible {
        outline: 2px solid #ff3e00;
        outline-offset: 2px;
    }

    .tooltip-text {
        visibility: hidden;
        opacity: 0;
        position: absolute;
        bottom: 140%;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(50, 50, 50, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 400;
        z-index: 9999;
        transition: opacity 0.25s ease, transform 0.25s ease;
        max-width: 350px;
        min-width: 200px;
        white-space: normal;
        text-align: center;
        line-height: 1.5;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tooltip-text::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -6px;
        border-width: 6px;
        border-style: solid;
        border-color: rgba(50, 50, 50, 0.95) transparent transparent transparent;
    }

    /* Desktop: Hover */
    @media (hover: hover) and (pointer: fine) {
        .tooltip-container:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
    }

    /* Mobile/Click: Toggle */
    .tooltip-text.visible {
        visibility: visible;
        opacity: 1;
    }
</style>
