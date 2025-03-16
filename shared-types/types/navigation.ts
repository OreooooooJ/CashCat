import type { Component } from 'vue'

export interface NavItem {
  name: string
  path: string
  icon?: Component
  children?: NavItem[]
  meta?: {
    requiresAuth?: boolean
    roles?: string[]
  }
} 