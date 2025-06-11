<template>
  <div class="relative flex h-full">
    <!-- Sidebar -->
    <div
      :class="[
        'h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col',
        isExpanded ? 'w-64' : 'w-16'
      ]"
    >
      <!-- Toggle Button -->
      <button
        @click="toggleSidebar"
        class="p-4 hover:bg-gray-100 transition-colors relative group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-600"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <line x1="9" x2="9" y1="3" y2="21" />
        </svg>
        
        <!-- Tooltip -->
        <div
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
        >
          {{ isExpanded ? 'Collapse sidebar' : 'Expand sidebar' }}
          <div class="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900"></div>
        </div>
      </button>

      <!-- New Chat Button -->
      <button
        @click="newChat"
        class="mx-3 mb-4 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 relative group"
        :class="{ 'px-4': isExpanded }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-600"
        >
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
        <span v-if="isExpanded" class="text-sm font-medium text-gray-700">New Chat</span>
        
        <!-- Tooltip when collapsed -->
        <div
          v-if="!isExpanded"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
        >
          New Chat (⌘K)
          <div class="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900"></div>
        </div>
      </button>

      <!-- Navigation Items -->
      <nav class="flex-1 px-3 space-y-1">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group',
            isActiveRoute(item.path)
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="isExpanded" class="text-sm font-medium">{{ item.name }}</span>
          
          <!-- Tooltip when collapsed -->
          <div
            v-if="!isExpanded"
            class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
          >
            {{ item.name }}
            <div class="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900"></div>
          </div>
        </NuxtLink>
      </nav>

      <!-- User Settings at bottom -->
      <div class="px-3 pb-4">
        <button
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full relative group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="flex-shrink-0"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span v-if="isExpanded" class="text-sm font-medium">User Settings</span>
          
          <!-- Tooltip when collapsed -->
          <div
            v-if="!isExpanded"
            class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
          >
            User Settings
            <div class="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900"></div>
          </div>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isExpanded = ref(true)

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
}

const newChat = () => {
  router.push('/')
}

const isActiveRoute = (path: string) => {
  return route.path === path
}

// Navigation items with icons
const navigationItems = [
  {
    name: 'Chats',
    path: '/',
    icon: h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })
    ])
  },
  {
    name: 'Projects',
    path: '/projects',
    icon: h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' })
    ])
  },
  {
    name: 'Containers',
    path: '/containers',
    icon: h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' }),
      h('rect', { width: '10', height: '10', x: '7', y: '7', rx: '1', ry: '1' })
    ])
  }
]

// Keyboard shortcut for new chat (cmd+k)
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    newChat()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>