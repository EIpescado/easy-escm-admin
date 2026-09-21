<script setup lang="ts">
import HeaderBanner from './modules/header-banner.vue';
import CardData from './modules/card-data.vue';
import LineChart from './modules/line-chart.vue';
import PieChart from './modules/pie-chart.vue';
import ProjectNews from './modules/project-news.vue';
import CreativityBanner from './modules/creativity-banner.vue';
</script>

<template>
  <div class="home-dashboard flex flex-col gap-16px">
    <HeaderBanner class="shrink-0" />
    <CardData class="shrink-0" />
    <div class="min-h-[240px] flex flex-1 gap-16px lt-lg:flex-col">
      <div class="min-h-0 min-w-0 flex-[7] lt-lg:min-h-[220px]">
        <LineChart />
      </div>
      <div class="min-h-0 min-w-0 flex-[5] lt-lg:min-h-[220px]">
        <PieChart />
      </div>
    </div>
    <div class="min-h-[220px] flex flex-1 gap-16px lt-lg:flex-col">
      <div class="min-h-0 min-w-0 flex-[7] lt-lg:min-h-[200px]">
        <ProjectNews />
      </div>
      <div class="min-h-0 min-w-0 flex-[5] lt-lg:min-h-[200px]">
        <CreativityBanner />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-dashboard {
  height: 100%;
  overflow: hidden;
}

/* on short screens, allow the page to scroll instead of squeezing the cards */
@media (max-height: 900px) {
  .home-dashboard {
    overflow-y: auto;
  }
}
</style>
