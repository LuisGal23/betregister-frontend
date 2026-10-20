import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LedgerState } from '../../../../core/services/ledger-state.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { TranslationService } from '../../../../core/services/translation.service';

export interface ProfileData {
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  telegram: string;
  twitter: string;
  favorite_sports: string[];
  is_tipster: boolean;
  public_profile_enabled: boolean;
  show_bank_units: boolean;
  display_currency?: string;
  timezone?: string;
}

export interface AvatarPreset {
  id: string;
  category: 'tipsters' | 'sports' | 'animals';
  label: string;
  url: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './profile-page.component.html',
  host: { class: 'block max-w-[1200px] mx-auto px-4 sm:px-6 py-6' },
})
export class ProfilePageComponent implements OnInit {
  api = inject(ApiService);
  vm = inject(LedgerState);
  i18n = inject(TranslationService);

  loading = signal(false);
  saving = signal(false);
  success = signal('');
  error = signal('');

  // Editable fields
  username = signal('');
  displayName = signal('');
  avatarUrl = signal('');
  bio = signal('');
  telegram = signal('');
  twitter = signal('');
  favoriteSports = signal<string[]>(['Fútbol', 'NFL']);
  isTipster = signal(true);
  publicProfileEnabled = signal(true);
  showBankUnits = signal(true);

  // Filter category for preset avatars
  avatarCategory = signal<'all' | 'tipsters' | 'sports' | 'animals'>('all');

  // Available sports for selection
  allSports = ['Fútbol', 'NFL', 'Béisbol', 'NBA', 'Tenis', 'UFC / Boxeo', 'Hockey', 'eSports'];

  // High-quality, copyright-free / open-source avatars (DiceBear CC0/MIT)
  avatarPresets: AvatarPreset[] = [
    // Tipsters & Estrategia
    { id: 'sniper', category: 'tipsters', label: '🎯 Francotirador', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SniperPicks&backgroundColor=0284c7' },
    { id: 'crown', category: 'tipsters', label: '👑 Rey de Cuotas', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingOdds&backgroundColor=f59e0b' },
    { id: 'analyst', category: 'tipsters', label: '🧠 Analista Pro', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DataAnalyst&backgroundColor=10b981' },
    { id: 'streak', category: 'tipsters', label: '⚡ Racha Verde', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GreenStreak&backgroundColor=22c55e' },
    { id: 'saber', category: 'tipsters', label: '📊 Sabermetría', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SaberMetric&backgroundColor=6366f1' },
    { id: 'rocket', category: 'tipsters', label: '🚀 Rocket Bank', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RocketBank&backgroundColor=ec4899' },

    // Deportes
    { id: 'soccer', category: 'sports', label: '⚽ Goleador 10', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SoccerStar&backgroundColor=059669' },
    { id: 'nfl', category: 'sports', label: '🏈 Mariscal NFL', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=QuarterBack&backgroundColor=dc2626' },
    { id: 'baseball', category: 'sports', label: '⚾ Bateador Power', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HomeRun&backgroundColor=2563eb' },
    { id: 'hoops', category: 'sports', label: '🏀 Baloncestista', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hoops&backgroundColor=ea580c' },
    { id: 'boxing', category: 'sports', label: '🥊 Campeón KO', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Knockout&backgroundColor=7c3aed' },
    { id: 'tennis', category: 'sports', label: '🎾 As del Tenis', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AceTennis&backgroundColor=84cc16' },

    // Mascotas & Totems
    { id: 'lion', category: 'animals', label: '🦁 León del Bank', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=LionKing&backgroundColor=d97706' },
    { id: 'hawk', category: 'animals', label: '🦅 Halcón Cuotas', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=FalconEye&backgroundColor=0284c7' },
    { id: 'wolf', category: 'animals', label: '🐺 Lobo Solitario', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=AlphaWolf&backgroundColor=475569' },
    { id: 'bull', category: 'animals', label: '🐂 Toro Alcista', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=BullMarket&backgroundColor=16a34a' },
    { id: 'shark', category: 'animals', label: '🦈 Tiburón Picks', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=SharkOdds&backgroundColor=0891b2' },
    { id: 'panther', category: 'animals', label: '🐆 Pantera Ágil', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=BlackPanther&backgroundColor=334155' },
  ];

  filteredPresets = computed(() => {
    const cat = this.avatarCategory();
    if (cat === 'all') return this.avatarPresets;
    return this.avatarPresets.filter((p) => p.category === cat);
  });

  // User's community public stats
  userStats = computed(() => {
    const closed = this.vm.data().bets.filter((b) => ['won', 'lost', 'cashout'].includes(b.status));
    const won = closed.filter((b) => b.status === 'won').length;
    const lost = closed.filter((b) => b.status === 'lost').length;
    const decisive = won + lost;
    const winRate = decisive > 0 ? (won / decisive) * 100 : null;

    let totalProfit = 0;
    let totalStake = 0;
    for (const b of closed) {
      const s = this.vm.converted(b.stake, b.currency as any) ?? 0;
      const p = this.vm.converted(b.payout - b.stake, b.currency as any) ?? 0;
      totalStake += s;
      totalProfit += p;
    }
    const yieldPct = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
    const unitsWon = (totalProfit / (Number(this.vm.data().profile.units?.value) || 100)).toFixed(1);

    return {
      totalClosed: closed.length,
      won,
      lost,
      winRate: winRate !== null ? winRate.toFixed(1) + '%' : '—',
      yield: (yieldPct > 0 ? '+' : '') + yieldPct.toFixed(1) + '%',
      profit: this.vm.format(totalProfit),
      unitsWon: (Number(unitsWon) > 0 ? '+' : '') + unitsWon + 'u',
    };
  });

  ngOnInit() {
    this.hydrateFromLocal();
    void this.loadProfile();
  }

  hydrateFromLocal() {
    try {
      const saved = localStorage.getItem('betregister_user_profile');
      if (saved) {
        const p = JSON.parse(saved);
        this.applyProfile(p);
        return;
      }
    } catch {}

    // Fallback to vm.data().profile
    const p = this.vm.data().profile;
    this.applyProfile(p);
  }

  applyProfile(p: any) {
    if (!p) return;
    const defaultUser = p.username || (p.email ? p.email.split('@')[0] : 'usuario');
    this.username.set(p.username || defaultUser);
    this.displayName.set(p.display_name || defaultUser);
    this.avatarUrl.set(p.avatar_url || '');
    this.bio.set(p.bio || '');
    this.telegram.set(p.telegram || '');
    this.twitter.set(p.twitter || '');
    if (Array.isArray(p.favorite_sports) && p.favorite_sports.length > 0) {
      this.favoriteSports.set(p.favorite_sports);
    }
    if (typeof p.is_tipster === 'boolean') this.isTipster.set(p.is_tipster);
    if (typeof p.public_profile_enabled === 'boolean') this.publicProfileEnabled.set(p.public_profile_enabled);
    if (typeof p.show_bank_units === 'boolean') this.showBankUnits.set(p.show_bank_units);
  }

  async loadProfile() {
    this.loading.set(true);
    try {
      const res = await this.api.request<ProfileData>('/user-profile');
      if (res) {
        this.applyProfile(res);
        try {
          localStorage.setItem('betregister_user_profile', JSON.stringify(res));
        } catch {}
      }
    } catch {
      // Backend not yet available or offline; local profile remains active safely
    } finally {
      this.loading.set(false);
    }
  }

  toggleSport(sport: string) {
    const current = [...this.favoriteSports()];
    const idx = current.indexOf(sport);
    if (idx >= 0) {
      if (current.length > 1) {
        current.splice(idx, 1);
      }
    } else {
      current.push(sport);
    }
    this.favoriteSports.set(current);
  }

  selectPresetAvatar(url: string) {
    this.avatarUrl.set(url);
  }

  clearAvatar() {
    this.avatarUrl.set('');
  }

  onFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP, etc.).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      this.error.set('La imagen supera el límite de 8MB. Elige una imagen más liviana.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress using HTML5 Canvas to 160x160 max JPEG
        const canvas = document.createElement('canvas');
        const maxDim = 160;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          this.avatarUrl.set(compressed);
          this.success.set('¡Foto cargada con éxito desde tu dispositivo! Haz clic en "Guardar Cambios".');
          setTimeout(() => this.success.set(''), 4000);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  }

  async save() {
    const u = this.username().trim().replace(/^@/, '');
    if (!u || u.length < 2) {
      this.error.set('Por favor escribe un nombre de usuario válido de al menos 2 caracteres.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    const payload = {
      username: u,
      display_name: this.displayName().trim() || u,
      avatar_url: this.avatarUrl().trim(),
      bio: this.bio().trim(),
      telegram: this.telegram().trim(),
      twitter: this.twitter().trim(),
      favorite_sports: this.favoriteSports(),
      is_tipster: this.isTipster(),
      public_profile_enabled: this.publicProfileEnabled(),
      show_bank_units: this.showBankUnits(),
    };

    // 1. Guardar de inmediato en localStorage (resiliente ante cualquier fallo de red/proxy)
    try {
      localStorage.setItem('betregister_user_profile', JSON.stringify(payload));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 2. Actualizar estado reactivo de Angular de inmediato
    this.vm.data.update((d) => ({
      ...d,
      profile: {
        ...d.profile,
        ...payload,
      },
    }));

    // 3. Notificar al backend en segundo plano
    try {
      await this.api.request('/user-profile', payload);
    } catch (e) {
      console.warn('Backend sync pendiente (los cambios quedaron guardados localmente):', e);
    } finally {
      this.saving.set(false);
      this.success.set('¡Perfil actualizado con éxito! Tu avatar y nombre ya están guardados y activos.');
      setTimeout(() => this.success.set(''), 4000);
    }
  }
}
