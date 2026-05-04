<template>
  <div class="not-found">
    <div class="content">
      <div class="icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="1.2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
      </div>
      <h1 class="title font-display">לא ניתן לטעון את הנתונים</h1>
      <p class="desc">הקישור אינו תקין או שפג תוקפו.</p>
      <p class="contact">נסה לרענן את הדף או פנה ל-Webz Digital</p>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
}

.icon {
  opacity: 0.5;
}

.title {
  font-family: 'DM Serif Display', serif;
  font-size: 32px;
  color: var(--text);
  font-weight: 400;
}

.desc {
  font-size: 15px;
  color: var(--text-muted);
}

.contact {
  font-size: 13px;
  color: var(--gold);
}
</style>
