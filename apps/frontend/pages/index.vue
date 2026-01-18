<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 class="text-3xl font-bold text-gray-900">Feed2Fedi</h1>
        <p class="text-gray-600 mt-1">
          Self-hosted Fediverse ActivityPub server with RSS automation
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Accounts Section -->
        <section class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Fediverse Accounts</h2>
          <div class="space-y-4">
            <p class="text-gray-600">Manage your Fediverse accounts</p>
            <NuxtLink
              to="/accounts"
              class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              View Accounts
            </NuxtLink>
          </div>
        </section>

        <!-- Feeds Section -->
        <section class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">RSS Feeds</h2>
          <div class="space-y-4">
            <p class="text-gray-600">Add and manage RSS feeds to autopost</p>
            <NuxtLink
              to="/feeds"
              class="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              View Feeds
            </NuxtLink>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});
</script>

<style scoped></style>
