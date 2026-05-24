<div class="panel">
    <div class="panel-header">
        {#if removeHandler}
            <button class="remove-button" on:click={removeHandler}>&#10060;</button>
        {/if}
        <button class="panel-button" on:click={() => isOpen = !isOpen}>
            <span class="heading">{heading}</span>
            <span class="icon">{#if isOpen}&mapstoup;{:else}&mapstodown;{/if}</span>
        </button>
    </div>

    <section class:isOpen class="panel-content">
        <slot></slot>
    </section>
</div>


<script>
    export let heading;
    export let isOpen;
    export let removeHandler = null;
</script>


<style>
    .panel {
        margin-bottom: 5px;
    }

    .panel-header {
        margin: 0;
        border: 1px solid #ddd;
        transition: .3s;
        display: flex;
        position: relative;
        z-index: 1;
        padding: 0;
    }

    .heading {
        font-size: 1rem;
        margin: 0;
    }

    .icon {
        font-size: 1.2rem;
        margin: 0;
    }

    .panel-content {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        height: 0;
        overflow: hidden;
        transition: height 0.5s;
        margin: 0;
        border: none;
        visibility: hidden;
    }

    .panel-button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: white;
        color: #666;
        text-align: left;
        border: none;
        padding: 4px 8px;
        margin: 0;
    }

    .remove-button {
        height: 22px;
        width: 22px;
        color: #999;
        border: 1px solid #ccc;
        background: none;
        font-size: 0.5rem;
        margin-left: 4px;
        margin-top: 4px;
        margin-bottom: 4px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .remove-button:hover {
        color: #ff3e00;
        border-color: #ff3e00;
    }

    .isOpen {
        border: 1px solid #ddd;
        border-top: none;
        height: fit-content;
        padding: 4px;
        visibility: visible;
        position: relative;
        z-index: 2;
        overflow: visible;
    }

    @media screen and (min-width: 984px) {
        
        .panel-content {
            display: flex;
            flex-direction: row;
            justify-content: center;
        }
    }


</style>