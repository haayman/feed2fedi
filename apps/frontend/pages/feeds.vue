<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/" class="text-blue-500 hover:text-blue-600"
          >← Back</NuxtLink
        >
        <h1 class="text-3xl font-bold text-gray-900 mt-2">RSS Feeds</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">All Feeds</h2>
          <button
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Feed
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead class="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-bold">Title</th>
                <th class="px-6 py-3 text-left text-sm font-bold">Account</th>
                <th class="px-6 py-3 text-left text-sm font-bold">Status</th>
                <th class="px-6 py-3 text-left text-sm font-bold">
                  Last Fetched
                </th>
                <th class="px-6 py-3 text-left text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="feeds.length === 0" class="border-b">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  No feeds found
                </td>
              </tr>
              <tr
                v-for="feed in feeds"
                :key="feed.id"
                class="border-b hover:bg-gray-50"
              >
                <td class="px-6 py-4">{{ feed.title }}</td>
                <td class="px-6 py-4">{{ feed.account?.username }}</td>
                <td class="px-6 py-4">
                  <span
                    :class="
                      feed.status === 'active'
                        ? 'text-green-600'
                        : feed.status === 'inactive'
                          ? 'text-gray-600'
                          : 'text-red-600'
                    "
                  >
                    {{ feed.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  {{
                    feed.lastFetchedAt
                      ? new Date(feed.lastFetchedAt).toLocaleDateString()
                      : "Never"
                  }}
                </td>
                <td class="px-6 py-4">
                  <button class="text-blue-500 hover:text-blue-600 mr-2">
                    Edit
                  </button>
                  <button class="text-red-500 hover:text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - Nuxt auto-injects composables like useRuntimeConfig and $fetch
import { ref, onMounted } from "vue";

interface Feed {
  id: string;
  title: string;
  url: string;
  status: string;
  lastFetchedAt?: Date;
  account?: { username: string };
}

const feeds = ref<Feed[]>([]);

onMounted(async () => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch<Feed[]>("/feeds", {
      baseURL: config.public.apiBase,
    });
    feeds.value = response || [];
  } catch (error) {
    console.error("Failed to load feeds:", error);
  }
});
</script>

<style scoped></style>
