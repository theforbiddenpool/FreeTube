<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="ft-input-component"
    :class="{
      search: isSearch,
      forceTextColor: forceTextColor,
      showActionButton: showActionButton,
      showClearTextButton: showClearTextButton,
      clearTextButtonVisible: inputDataPresent,
      disabled: disabled
    }"
  >
    <label
      v-if="showLabel"
      :for="id"
    >
      {{ placeholder }}
      <ft-tooltip
        v-if="tooltip !== ''"
        class="selectTooltip"
        position="bottom"
        :tooltip="tooltip"
      />
    </label>
    <font-awesome-icon
      v-if="showClearTextButton"
      :icon="['fas', 'times-circle']"
      class="clearInputTextButton"
      :class="{
        visible: inputDataPresent
      }"
      tabindex="0"
      role="button"
      :title="$t('Search Bar.Clear Input')"
      @click="handleClearTextClick"
      @keydown.space.prevent="handleClearTextClick"
      @keydown.enter.prevent="handleClearTextClick"
    />
    <input
      :id="id"
      ref="input"
      v-model="inputData"
      :list="idDataList"
      class="ft-input"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :spellcheck="spellcheck"
      @input="e => handleInput(e.target.value)"
      @focus="handleFocus"
      @blur="handleInputBlur"
      @keydown="handleKeyDown"
    >
    <font-awesome-icon
      v-if="showActionButton"
      :icon="actionButtonIconName"
      class="inputAction"
      :class="{
        enabled: inputDataPresent
      }"
      @click="handleClick"
    />

    <div class="options">
      <ul
        v-if="inputData !== '' && visibleDataList.length > 0 && searchState.showOptions"
        :id="idDataList"
        class="list"
        @mouseenter="searchState.isPointerInList = true"
        @mouseleave="searchState.isPointerInList = false"
      >
        <!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
        <li
          v-for="(list, index) in visibleDataList"
          :key="index"
          :class="searchState.selectedOption == index ? 'hover': ''"
          @click="handleOptionClick(index)"
          @mouseenter="searchState.selectedOption = index"
        >
          {{ list }}
        </li>
        <!-- skipped -->
      </ul>
    </div>
  </div>
</template>

<script src="./ft-input.js" />
<style scoped src="./ft-input.css" />
