import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { TicketModalService } from '../../../apuestas/services/ticket-modal.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PublicarPronosticoModalComponent } from '../../modales/publicar-pronostico-modal/publicar-pronostico-modal.component';
import type { TipsterAuthor, TipsterPost } from '../../services/community.model';
export type { TipsterAuthor, TipsterPost };

const DEFAULT_SEED_POSTS: TipsterPost[] = [
  {
    id: 'post_seed_1',
    user_id: 9991,
    author: {
      username: 'ElMagoDelGol',
      display_name: "Carlos 'El Mago'",
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      is_verified: true,
      badge: 'Pro Tipster',
      stats: {
        yield: '+28.4%',
        win_rate: '69.2%',
        units: '+48.5u',
        streak: '🔥 4G',
      },
    },
    created_at: 'Hace 25 min',
    sport: 'Fútbol',
    league: 'Champions League',
    event: 'Real Madrid vs Manchester City',
    home: 'Real Madrid',
    away: 'Manchester City',
    home_logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    away_logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    market: 'Ambos Anotan & Total',
    pick: 'Ambos Equipos Anotan (Sí) & Más de 2.5 Goles',
    odds: '1.92',
    units: 2.0,
    rationale: 'Partidazo ofensivo donde ambos llegan con su mejor artillería en punta. El Madrid ha marcado en todos sus juegos de local esta temporada y el City promedia 2.6 goles. Enorme valor en este mercado combinado.',
    reactions: { fire: 24, like: 18, copies: 9 },
    status: 'pending',
  },
  {
    id: 'post_seed_2',
    user_id: 9992,
    author: {
      username: 'NFLPicksPro',
      display_name: 'Dan Rodríguez',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      is_verified: true,
      badge: 'NFL Specialist',
      stats: {
        yield: '+19.8%',
        win_rate: '64.0%',
        units: '+36.2u',
        streak: '🔥 3G',
      },
    },
    created_at: 'Hace 1 hora',
    sport: 'NFL',
    league: 'NFL',
    event: 'Kansas City Chiefs vs San Francisco 49ers',
    home: 'San Francisco 49ers',
    away: 'Kansas City Chiefs',
    home_logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
    away_logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
    market: 'Hándicap / Spread',
    pick: 'Kansas City Chiefs +2.5',
    odds: '1.90',
    units: 1.5,
    rationale: 'Mahomes como underdog en partidos de alta exigencia tiene un récord histórico de 11-3 ATS. La defensa de Kansas City está limitando el juego terrestre a menos de 95 yardas por partido. Vamos con los Chiefs cubriendo.',
    reactions: { fire: 38, like: 25, copies: 14 },
    status: 'pending',
  },
  {
    id: 'post_seed_3',
    user_id: 9993,
    author: {
      username: 'GreenMaster',
      display_name: 'Sofi Analytics',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      is_verified: true,
      badge: 'Estadística & Modelos',
      stats: {
        yield: '+22.1%',
        win_rate: '66.7%',
        units: '+41.0u',
        streak: '🔥 5G',
      },
    },
    created_at: 'Hace 3 horas',
    sport: 'Fútbol',
    league: 'Premier League',
    event: 'Arsenal vs Chelsea',
    home: 'Arsenal',
    away: 'Chelsea',
    home_logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    away_logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
    market: 'Moneyline',
    pick: 'Arsenal a Ganar (ML)',
    odds: '1.80',
    units: 2.5,
    rationale: 'Arsenal ha ganado 7 de sus últimos 8 partidos en el Emirates generando un promedio de xG de 2.4 frente a rivales directos. La transición defensiva de Chelsea concede muchas ocasiones por bandas.',
    reactions: { fire: 45, like: 31, copies: 21 },
    status: 'won',
  },
];

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, PublicarPronosticoModalComponent],
  templateUrl: './community-page.component.html',
  host: { class: 'block max-w-[1440px] mx-auto px-4 sm:px-6 py-6 pb-20' },
})
export class CommunityPageComponent implements OnInit {
  api = inject(ApiService);
  vm = inject(LedgerState);
  ticketModal = inject(TicketModalService);

  loading = signal(false);
  posts = signal<TipsterPost[]>([]);
  activeFilter = signal<'trending' | 'recent' | 'futbol' | 'nfl' | 'baseball' | 'my_posts'>('trending');

  // Create post modal state
  showCreateModal = signal(false);

  // Top Tipsters Leaderboard
  topTipsters = [
    {
      rank: 1,
      name: 'Carlos "El Mago"',
      username: 'ElMagoDelGol',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: 'Pro Tipster',
      specialty: 'Fútbol Europeo',
      yield: '+28.4%',
      units: '+48.5u',
      winRate: '69%',
      streak: '🔥 4G',
      following: false,
    },
    {
      rank: 2,
      name: 'Sofi Analytics',
      username: 'GreenMaster',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      badge: 'Modelos & Datos',
      specialty: 'Premier & Champions',
      yield: '+22.1%',
      units: '+41.0u',
      winRate: '67%',
      streak: '🔥 5G',
      following: false,
    },
    {
      rank: 3,
      name: 'Dan Rodríguez',
      username: 'NFLPicksPro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      badge: 'NFL Specialist',
      specialty: 'NFL Spreads & Props',
      yield: '+19.8%',
      units: '+36.2u',
      winRate: '64%',
      streak: '🔥 3G',
      following: false,
    },
    {
      rank: 4,
      name: 'Héctor Béisbol',
      username: 'MLBKing',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      badge: 'Sabermetría',
      specialty: 'MLB & KBO',
      yield: '+16.5%',
      units: '+29.4u',
      winRate: '61%',
      streak: '🔥 2G',
      following: false,
    },
  ];

  filteredPosts = computed(() => {
    const list = this.posts();
    const filter = this.activeFilter();
    const myUsername = (this.vm.data().profile.username || this.vm.data().profile.email.split('@')[0]).toLowerCase();

    switch (filter) {
      case 'trending':
        return [...list].sort(
          (a, b) => b.reactions.fire + b.reactions.like - (a.reactions.fire + a.reactions.like),
        );
      case 'recent':
        return list;
      case 'futbol':
        return list.filter((p) => p.sport.toLowerCase().includes('fút') || p.sport.toLowerCase().includes('soc'));
      case 'nfl':
        return list.filter((p) => p.sport.toLowerCase().includes('nfl') || p.sport.toLowerCase().includes('americ'));
      case 'baseball':
        return list.filter((p) => p.sport.toLowerCase().includes('béis') || p.sport.toLowerCase().includes('base'));
      case 'my_posts':
        return list.filter((p) => p.author.username.toLowerCase() === myUsername);
      default:
        return list;
    }
  });

  ngOnInit() {
    void this.loadPosts();
  }

  async loadPosts() {
    this.loading.set(true);

    // 1. Recover locally saved community posts immediately
    let localPosts: TipsterPost[] = [];
    try {
      const stored = localStorage.getItem('betregister_community_posts');
      if (stored) {
        localPosts = JSON.parse(stored);
      }
    } catch {}

    try {
      const res = await this.api.request<{ posts: TipsterPost[] }>('/community/posts');
      if (res?.posts && res.posts.length > 0) {
        // Merge without duplicates by ID
        const seenIds = new Set(res.posts.map((p) => p.id));
        const merged = [...res.posts];
        for (const lp of localPosts) {
          if (!seenIds.has(lp.id)) {
            merged.unshift(lp);
            seenIds.add(lp.id);
          }
        }
        this.posts.set(merged);
        return;
      }
    } catch {
      // Remote backend unavailable or returning 404
    } finally {
      this.loading.set(false);
    }

    // Fallback: merge local posts with default seed posts
    const seen = new Set(localPosts.map((p) => p.id));
    const combined = [...localPosts];
    for (const seed of DEFAULT_SEED_POSTS) {
      if (!seen.has(seed.id)) {
        combined.push(seed);
      }
    }
    this.posts.set(combined);
  }

  async reactPost(post: TipsterPost, type: 'fire' | 'like') {
    if (type === 'fire') {
      if (post.userReactedFire) return;
      post.userReactedFire = true;
      post.reactions.fire += 1;
    } else {
      if (post.userReactedLike) return;
      post.userReactedLike = true;
      post.reactions.like += 1;
    }

    this.posts.set([...this.posts()]);

    try {
      await this.api.request(`/community/posts/${post.id}/react`, { type });
    } catch {
      // Non-blocking
    }
  }

  copyToMyTicket(post: TipsterPost) {
    post.reactions.copies += 1;
    this.posts.set([...this.posts()]);

    const numOdds = parseFloat(post.odds);
    this.ticketModal.open({
      eventLabel: post.event,
      odds: !isNaN(numOdds) ? numOdds : null,
      market: post.market,
      pick: post.pick,
      description: `${post.pick} @ ${post.odds} (Pronóstico de @${post.author.username})`,
    });
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  onPostCreated(post: TipsterPost) {
    this.posts.update((prev) => [post, ...prev]);
  }

  toggleFollow(tipster: any) {
    tipster.following = !tipster.following;
  }
}
