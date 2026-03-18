import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, MatIconModule, NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="news-page">

      <!-- ═══════════════════════ HEADER ═══════════════════════ -->
      <header class="news-header">
        <!-- Logos izquierda -->
        <div class="header-logos">
          <img ngSrc="logo_inei_azul.png" alt="Logo INEI" width="240" height="70" priority class="logo-inei">
          <div class="logo-divider"></div>
          <img ngSrc="logo_cpv.png" alt="Logo CPV 2025" width="200" height="60" class="logo-cpv-inline">
        </div>

        <!-- Nav derecha -->
        <nav class="main-nav">
          <button routerLink="/" class="nav-btn">
            Inicio
            <span class="nav-underline"></span>
          </button>
          <button routerLink="/resultados" class="nav-btn">
            Resultados
            <span class="nav-underline"></span>
          </button>
          <button routerLink="/publicaciones" class="nav-btn">
            Publicaciones
            <span class="nav-underline"></span>
          </button>

          <div class="dropdown-wrapper">
            <button (click)="toggleCensos($event)" class="nav-btn nav-btn--dropdown">
              Censos 2025
              <mat-icon class="dropdown-icon" [class.rotate-180]="censosOpen()">expand_more</mat-icon>
              <span class="nav-underline"></span>
            </button>
            @if (censosOpen()) {
              <div class="dropdown-menu">
                <div class="dropdown-bar"></div>
                <ul class="dropdown-list">
                  @for (item of censosMenu; track item.label) {
                    <li>
                      <button [routerLink]="item.route" (click)="censosOpen.set(false)" class="dropdown-item">
                        {{ item.label }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          <button routerLink="/noticias" class="nav-btn nav-btn--active">
            Noticias
            <span class="nav-underline nav-underline--active"></span>
          </button>
        </nav>
      </header>

      <!-- ═══════════════════════ NOTICIAS ═══════════════════════ -->
      <section class="news-section">
        <div class="section-title-wrap">
          <h2 class="section-title section-title--blue">NOTICIAS</h2>
        </div>

        <!-- Carrusel móvil / grid escritorio -->
        <div class="news-carousel-track" [style.transform]="'translateX(-' + (currentNewsIndex() * 100) + '%)'">
          @for (item of newsItems; track item.id) {
            <div class="news-card">
              <div class="news-card__image-wrap">
                <img [ngSrc]="item.image" fill class="news-card__img" alt="News">
                <div class="news-card__tag">{{item.tag}}</div>
              </div>
              <div class="news-card__body">
                <div>
                  <h3 class="news-card__title">{{item.title}}</h3>
                  <p class="news-card__excerpt">{{item.excerpt}}</p>
                </div>
                <div class="news-card__cta">
                  Leer más
                  <mat-icon class="cta-icon">chevron_right</mat-icon>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Controles carrusel (visibles sólo en móvil/tablet) -->
        <div class="carousel-controls news-controls">
          <button (click)="prevNews()" class="carousel-btn">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <div class="carousel-dots">
            @for (item of newsItems; track item.id; let i = $index) {
              <span class="dot" [class.dot--active]="i === currentNewsIndex()"></span>
            }
          </div>
          <button (click)="nextNews()" class="carousel-btn">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </section>

      <!-- ═══════════════════════ VIDEOS ═══════════════════════ -->
      <section class="video-section">
        <!-- Fondo decorativo -->
        <div class="video-section__bg" aria-hidden="true"></div>

        <div class="section-title-wrap">
          <h2 class="section-title section-title--white">
            <span class="title-line"></span>
            VIDEOS
            <span class="title-line"></span>
          </h2>
        </div>

        <div class="video-player-wrap">
          <button (click)="prevVideo()" class="video-nav video-nav--prev" aria-label="Video anterior">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <div class="video-frame">
            @if (videoItems[currentVideoIndex()]; as video) {
              <img [ngSrc]="video.thumbnail" fill class="video-thumb" alt="Video thumbnail">
              <div class="video-overlay">
                <div class="play-btn">
                  <mat-icon>play_arrow</mat-icon>
                </div>
              </div>
              <div class="video-caption">
                <h3 class="video-caption__title">{{video.title}}</h3>
              </div>
            }
          </div>

          <button (click)="nextVideo()" class="video-nav video-nav--next" aria-label="Video siguiente">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <!-- Dots videos -->
        <div class="carousel-dots carousel-dots--video">
          @for (item of videoItems; track item.id; let i = $index) {
            <span class="dot dot--white" [class.dot--active]="i === currentVideoIndex()"></span>
          }
        </div>
      </section>

      <!-- ═══════════════════════ FOOTER ═══════════════════════ -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-info">
            <p class="footer-name">Instituto Nacional de Estadística e Informática – INEI</p>
            <p class="footer-address">Av. General Garzón 658. Jesús María. Lima - Perú</p>
            <div class="footer-social">
              <span class="footer-social__label">Síguenos:</span>
              <div class="footer-social__icons">
                <a href="https://www.facebook.com/INEIpaginaOficial/?locale=es_LA" class="social-link"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
                <a href="https://x.com/INEI_oficial?lang=es" class="social-link"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="https://www.instagram.com/inei_peru/?hl=es" class="social-link"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
                <a href="#" class="social-link"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/><path d="M17.49 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* ─── Reset host ─────────────────────────────────────── */
    :host { display: block; }

    /* ─── Página completa ────────────────────────────────── */
    .news-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: #EEEEEE;
      overflow-x: hidden;
    }

    /* ══════════════════════════════════════════════════════
       HEADER
    ══════════════════════════════════════════════════════ */
    .news-header {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      color: #343b9f;
      background: transparent;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .logo-inei {
      height: 3.5rem;
      width: auto;
      object-fit: contain;
    }

    /* Nav */
    .main-nav {
      display: none; /* oculto en móvil */
      align-items: center;
      gap: 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .nav-btn {
      background: none;
      border: none;
      color: #343b9f;
      cursor: pointer;
      text-transform: uppercase;
      position: relative;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: color 0.3s;
    }
    .nav-btn:hover { color: var(--secondary, #038dd3); }

    .nav-underline {
      position: absolute;
      bottom: -3px; left: 0;
      width: 0; height: 2px;
      background: var(--secondary, #038dd3);
      transition: width 0.3s;
    }
    .nav-btn:hover .nav-underline { width: 100%; }
    .nav-underline--active { width: 100%; }
    .nav-btn--active { color: var(--secondary, #038dd3); font-weight: 700; }

    .dropdown-icon {
      font-size: 1rem !important;
      transition: transform 0.2s;
    }
    .rotate-180 { transform: rotate(180deg); }

    /* Dropdown */
    .dropdown-wrapper { position: relative; }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.75rem);
      left: 0;
      width: 18rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 8px 30px rgba(0,0,0,.15);
      overflow: hidden;
      z-index: 200;
    }
    .dropdown-bar {
      height: 4px;
      background: linear-gradient(to right, var(--primary, #343b9f), var(--secondary, #038dd3));
    }
    .dropdown-list { list-style: none; margin: 0; padding: 0.25rem 0; }
    .dropdown-item {
      width: 100%;
      text-align: left;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: background 0.2s;
    }
    .dropdown-item:hover { background: #f9fafb; }

    /* Logo CPV (derecha pegado al borde) */
    .header-logo-cpv {
      display: none;
      position: fixed;
      top: 1rem;
      right: 0;           /* pegado al borde derecho */
      background: white;
      border-radius: 50px 0 0 50px;
      padding: 0.6rem 1.5rem 0.6rem 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,.15);
      z-index: 101;
    }
    .logo-cpv {
      height: 2.5rem;
      width: auto;
      object-fit: contain;
    }

    /* ══════════════════════════════════════════════════════
       SECCIÓN NOTICIAS
    ══════════════════════════════════════════════════════ */
    .news-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 5.5rem 1.25rem 2rem;  /* espacio para header fijo */
      background: #EEEEEE;
      overflow: hidden;
    }

    .section-title-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .section-title {
      font-size: clamp(1.4rem, 4vw, 3rem);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.03em;
    }
    .section-title--blue  { color: #038dd3; }
    .section-title--white { color: white; display: flex; align-items: center; gap: 1rem; }
    .title-line {
      display: block;
      width: 3rem; height: 3px;
      background: rgba(255,255,255,.4);
    }

    /* ── Carrusel noticias (móvil: 1 card; tablet: overflow; desktop: grid) ── */
    .news-carousel-track {
      display: flex;
      /* transición suave en móvil/tablet */
      transition: transform 0.4s cubic-bezier(.25,.8,.25,1);
      gap: 1.5rem;
      flex: 1;
      min-height: 0;
    }

    .news-card {
      /* por defecto cada card ocupa el 100% en móvil */
      flex: 0 0 100%;
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: box-shadow 0.3s, transform 0.3s;
      min-height: 320px;
    }
    .news-card:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,.18);
      transform: translateY(-4px);
    }

    .news-card__image-wrap {
      position: relative;
      height: 180px;
      flex-shrink: 0;
      overflow: hidden;
    }
    .news-card__img {
      object-fit: cover;
      transition: transform 0.6s;
    }
    .news-card:hover .news-card__img { transform: scale(1.06); }

    .news-card__tag {
      position: absolute;
      top: 0.75rem; left: 0.75rem;
      background: var(--primary, #343b9f);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }

    .news-card__body {
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      min-height: 0;
    }
    .news-card__title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #1f2937;
      margin: 0 0 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.35;
      transition: color 0.2s;
    }
    .news-card:hover .news-card__title { color: var(--primary, #343b9f); }
    .news-card__excerpt {
      font-size: 0.8rem;
      color: #6b7280;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.5;
      margin: 0;
    }
    .news-card__cta {
      padding-top: 0.75rem;
      display: flex;
      align-items: center;
      font-weight: 700;
      font-size: 0.78rem;
      color: var(--primary, #343b9f);
    }
    .cta-icon { font-size: 1rem !important; width: 1rem !important; height: 1rem !important; }

    /* Controles carrusel compartidos */
    .carousel-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      flex-shrink: 0;
    }
    .carousel-btn {
      background: white;
      border: none;
      border-radius: 50%;
      width: 2.25rem; height: 2.25rem;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,.12);
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
      color: var(--primary, #343b9f);
    }
    .carousel-btn:hover { background: var(--primary, #343b9f); color: white; transform: scale(1.08); }

    .carousel-dots {
      display: flex; gap: 0.4rem; align-items: center;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(52,59,159,.25);
      transition: background 0.3s, transform 0.3s;
    }
    .dot--active { background: var(--primary, #343b9f); transform: scale(1.3); }
    .dot--white { background: rgba(255,255,255,.35); }
    .dot--white.dot--active { background: white; }

    /* ══════════════════════════════════════════════════════
       SECCIÓN VIDEOS
    ══════════════════════════════════════════════════════ */
    .video-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      padding: 2rem 1.25rem 2rem;
      color: white;
      overflow: hidden;
    }

    .video-section::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg,
        var(--primary, #343b9f) 0%,
        var(--secondary, #038dd3) 100%);
      z-index: 0;
    }
    .video-section > * { position: relative; z-index: 1; }

    .video-section__bg {
      position: absolute;
      inset: 0; z-index: 0;
      background-image:
        radial-gradient(circle at 20% 50%, rgba(255,255,255,.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,.04) 0%, transparent 40%);
    }

    .video-player-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 0;
      position: relative;
    }

    .video-frame {
      flex: 1;
      max-width: 900px;
      aspect-ratio: 16 / 9;
      position: relative;
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
      border: 3px solid rgba(255,255,255,.12);
      /* Limita altura máxima para no desbordar */
      max-height: 55vh;
    }

    .video-thumb {
      object-fit: cover;
    }

    .video-overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.28);
      cursor: pointer;
      transition: background 0.3s;
    }
    .video-overlay:hover { background: rgba(0,0,0,.1); }

    .play-btn {
      width: 4rem; height: 4rem;
      background: rgba(255,255,255,.2);
      backdrop-filter: blur(12px);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid rgba(255,255,255,.3);
      transition: transform 0.25s;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }
    .play-btn mat-icon { font-size: 2rem !important; }
    .video-overlay:hover .play-btn { transform: scale(1.1); }

    .video-caption {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 1.5rem 1.25rem 1rem;
      background: linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.4) 60%, transparent 100%);
    }
    .video-caption__title {
      font-size: clamp(0.85rem, 2vw, 1.4rem);
      font-weight: 700;
      line-height: 1.3;
      margin: 0;
    }

    /* Botones nav vídeo */
    .video-nav {
      width: 2.5rem; height: 2.5rem;
      border-radius: 50%;
      background: rgba(255,255,255,.12);
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(255,255,255,.2);
      color: white;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.25s, transform 0.2s;
      flex-shrink: 0;
    }
    .video-nav:hover { background: rgba(255,255,255,.3); transform: scale(1.08); }

    .carousel-dots--video {
      justify-content: center;
      margin-top: 0.75rem;
      flex-shrink: 0;
    }

    /* ══════════════════════════════════════════════════════
       RESPONSIVE — desktop  ≥ 1024px
    ══════════════════════════════════════════════════════ */
    @media (min-width: 1024px) {
      .news-header { padding: 0.75rem 4rem; }

      .news-section { padding: 6rem 4rem 2rem; }
      .video-section { padding: 2.5rem 4rem 2rem; }

      /* 3 columnas en desktop */
      .news-carousel-track {
        grid-template-columns: repeat(3, 1fr);
      }

      .video-nav { width: 3rem; height: 3rem; }
    }


    /* ── Logos izquierda en header ─────────────────────── */
    .header-logos {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .logo-divider {
      display: none;
      width: 1px;
      height: 2.5rem;
      background: #e5e7eb;
    }
    .logo-cpv-inline {
      display: none;
      height: 2.5rem;
      width: auto;
      object-fit: contain;
    }

    /* ══════════════════════════════════════════════════════
       FOOTER
    ══════════════════════════════════════════════════════ */
    .site-footer {
      background: #484848;
      color: white;
      padding: 1.5rem;
      flex-shrink: 0;
    }
    .footer-inner {
      max-width: 80rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .footer-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.25rem;
    }
    .footer-name    { font-weight: 700; font-size: 0.95rem; }
    .footer-address { font-size: 0.875rem; color: #d1d5db; }
    .footer-social  { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap; justify-content: center; }
    .footer-social__label { font-size: 0.875rem; color: #d1d5db; }
    .footer-social__icons { display: flex; gap: 0.75rem; }
    .social-link { color: white; transition: color 0.2s; }
    .social-link:hover { color: var(--secondary, #038dd3); }

    @media (min-width: 768px) {
      .news-header { padding: 0.75rem 3rem; }
      .logo-inei   { height: 4rem; }
      .logo-divider    { display: block; }
      .logo-cpv-inline { display: block; }
      .main-nav    { display: flex; }

      .footer-inner { align-items: flex-end; }
      .footer-info  { align-items: flex-end; text-align: right; }
      .footer-social { justify-content: flex-end; }

      .news-section { padding: 6.5rem 3rem 2rem; }
      .video-section { padding: 2.5rem 3rem 2rem; }
      .news-carousel-track {
        transform: none !important;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        flex: 1;
      }
      .news-card { flex: none; }
      .news-controls { display: none; }
      .video-nav { width: 3rem; height: 3rem; }
      .play-btn  { width: 5rem; height: 5rem; }
      .play-btn mat-icon { font-size: 2.5rem !important; }
    }

    /* ══ RESPONSIVE — 2xl  ≥ 1536px
    ══════════════════════════════════════════════════════ */
    @media (min-width: 1536px) {
      .news-header  { padding: 1.25rem 6rem; }
      .logo-inei    { height: 5.5rem; }
      .logo-cpv        { height: 3.5rem; }
      .header-logo-cpv { padding: 0.75rem 2.5rem 0.75rem 2.5rem; top: 1.5rem; right: 0; }

      .main-nav { font-size: 1.1rem; gap: 3rem; }

      .news-section  { padding: 9rem 6rem 3rem; }
      .video-section { padding: 3rem 6rem 3rem; }

      .section-title  { font-size: 3rem; }
      .news-card__image-wrap { height: 220px; }
      .news-card__title   { font-size: 1.1rem; }
      .news-card__excerpt { font-size: 0.9rem; }

      .video-nav { width: 4rem; height: 4rem; }
      .play-btn  { width: 6rem; height: 6rem; }
      .play-btn mat-icon { font-size: 3.5rem !important; }
    }
  `]
})
export class NewsComponent {
  currentVideoIndex = signal(0);
  currentNewsIndex  = signal(0);
  censosOpen        = signal(false);

  censosMenu = [
    { label: 'Características del censo',     route: '/aspectos-generales' },
    { label: 'Innovaciones censales',           route: '/innovaciones' },
    { label: 'Etapas Censales',           route: '/organizacion' },
    { label: 'Normatividad censal',              route: '/normativa' },
    { label: 'Documentación Técnica',  route: '/documentacion-tecnica' },
  ];

  @HostListener('document:click')
  onDocumentClick() { this.censosOpen.set(false); }

  toggleCensos(event: Event) {
    event.stopPropagation();
    this.censosOpen.update(v => !v);
  }

  nextVideo() { this.currentVideoIndex.update(i => (i + 1) % this.videoItems.length); }
  prevVideo() { this.currentVideoIndex.update(i => (i - 1 + this.videoItems.length) % this.videoItems.length); }

  nextNews() { this.currentNewsIndex.update(i => (i + 1) % this.newsItems.length); }
  prevNews() { this.currentNewsIndex.update(i => (i - 1 + this.newsItems.length) % this.newsItems.length); }

  newsItems = [
    {
      id: 1,
      title: 'INEI inicia empadronamiento en zonas de difícil acceso',
      excerpt: 'Brigadas especiales se desplazan por vía fluvial para llegar a comunidades nativas.',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop',
      tag: 'Nacional'
    },
    {
      id: 2,
      title: 'Resultados preliminares muestran crecimiento demográfico',
      excerpt: 'El análisis destaca un aumento considerable en la población urbana.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
      tag: 'Estadística'
    },
    {
      id: 3,
      title: 'Uso de tecnología satelital optimiza la cartografía censal',
      excerpt: 'Herramientas GIS permiten precisión sin precedentes en la ubicación.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop',
      tag: 'Tecnología'
    }
  ];

  videoItems = [
    {
      id: 1,
      title: '¿Cómo recibir al empadronador de forma segura?',
      thumbnail: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'La importancia de los Censos 2025 para el futuro del país',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'
    }
  ];
}