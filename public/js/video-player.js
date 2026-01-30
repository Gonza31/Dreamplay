// Video Player - Sistema de reproducción y likes
class VideoPlayer {
    constructor() {
        this.currentVideo = null;
        this.videos = [];
        this.init();
    }

    async init() {
        // Cargar lista de videos
        await this.loadVideos();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar el primer video si hay videos disponibles
        if (this.videos.length > 0) {
            this.loadVideo(this.videos[0]);
        }
    }

    // Cargar lista de videos desde el servidor
    async loadVideos() {
        try {
            const response = await fetch('/api/videos');
            this.videos = await response.json();
            this.renderVideoList();
        } catch (error) {
            console.error('Error cargando videos:', error);
            // Datos de ejemplo si el servidor no responde
            this.videos = [
                {
                    id: 1,
                    title: "Trailer DreamPlay",
                    description: "Descubre las características de nuestra plataforma",
                    filename: "trailer.mp4",
                    likes: 15,
                    isLiked: false,
                    isFavorited: false
                },
                {
                    id: 2,
                    title: "Tutorial de Uso",
                    description: "Aprende a usar todas las funciones de DreamPlay",
                    filename: "tutorial.mp4",
                    likes: 8,
                    isLiked: false,
                    isFavorited: false
                },
                {
                    id: 3,
                    title: "Behind the Scenes",
                    description: "Cómo creamos DreamPlay desde cero",
                    filename: "behind-scenes.mp4",
                    likes: 23,
                    isLiked: false,
                    isFavorited: false
                }
            ];
            this.renderVideoList();
        }
    }

    // Cargar un video específico
    loadVideo(video) {
        this.currentVideo = video;
        
        // Actualizar el reproductor
        const videoPlayer = document.getElementById('videoPlayer');
        const videoTitle = document.getElementById('videoTitle');
        const videoDescription = document.getElementById('videoDescription');
        const likeCount = document.getElementById('likeCount');
        const likeBtn = document.getElementById('likeBtn');
        const favoriteBtn = document.getElementById('favoriteBtn');

        // Configurar fuente del video
        videoPlayer.src = `/videos/${video.filename}`;
        
        // Actualizar información
        videoTitle.textContent = video.title;
        videoDescription.textContent = video.description;
        likeCount.textContent = video.likes;

        // Actualizar estado de botones
        likeBtn.classList.toggle('liked', video.isLiked);
        favoriteBtn.classList.toggle('favorited', video.isFavorited);

        // Reproducir automáticamente
        videoPlayer.play().catch(error => {
            console.log('Reproducción automática bloqueada:', error);
        });
    }

    // Renderizar lista de videos
    renderVideoList() {
        const videoList = document.getElementById('videoList');
        videoList.innerHTML = '';

        this.videos.forEach(video => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.innerHTML = `
                <div class="video-thumbnail">
                    🎬
                </div>
                <div class="video-item-info">
                    <div class="video-item-title">${video.title}</div>
                    <div class="video-item-stats">
                        <span>${video.likes} ❤️</span>
                        <span>▶️ Reproducir</span>
                    </div>
                </div>
            `;

            videoItem.addEventListener('click', () => {
                this.loadVideo(video);
            });

            videoList.appendChild(videoItem);
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón de like
        document.getElementById('likeBtn').addEventListener('click', () => {
            this.toggleLike();
        });

        // Botón de favorito
        document.getElementById('favoriteBtn').addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Botón de compartir
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareVideo();
        });

        // Cuando el video termina, cargar el siguiente
        document.getElementById('videoPlayer').addEventListener('ended', () => {
            this.playNextVideo();
        });
    }

    // Alternar like
    async toggleLike() {
        if (!this.currentVideo) return;

        const likeBtn = document.getElementById('likeBtn');
        const likeCount = document.getElementById('likeCount');

        try {
            const response = await fetch('/api/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId: this.currentVideo.id,
                    action: this.currentVideo.isLiked ? 'unlike' : 'like'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentVideo.isLiked = !this.currentVideo.isLiked;
                this.currentVideo.likes = result.newLikes;
                
                likeBtn.classList.toggle('liked', this.currentVideo.isLiked);
                likeCount.textContent = this.currentVideo.likes;

                // Actualizar en la lista también
                const videoInList = this.videos.find(v => v.id === this.currentVideo.id);
                if (videoInList) {
                    videoInList.isLiked = this.currentVideo.isLiked;
                    videoInList.likes = this.currentVideo.likes;
                }
            }
        } catch (error) {
            console.error('Error al dar like:', error);
            // Simular like localmente si el servidor falla
            this.currentVideo.isLiked = !this.currentVideo.isLiked;
            this.currentVideo.likes += this.currentVideo.isLiked ? 1 : -1;
            
            likeBtn.classList.toggle('liked', this.currentVideo.isLiked);
            likeCount.textContent = this.currentVideo.likes;
        }
    }

    // Alternar favorito
    async toggleFavorite() {
        if (!this.currentVideo) return;

        const favoriteBtn = document.getElementById('favoriteBtn');

        try {
            const response = await fetch('/api/favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId: this.currentVideo.id,
                    action: this.currentVideo.isFavorited ? 'unfavorite' : 'favorite'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentVideo.isFavorited = !this.currentVideo.isFavorited;
                favoriteBtn.classList.toggle('favorited', this.currentVideo.isFavorited);

                // Actualizar en la lista también
                const videoInList = this.videos.find(v => v.id === this.currentVideo.id);
                if (videoInList) {
                    videoInList.isFavorited = this.currentVideo.isFavorited;
                }
            }
        } catch (error) {
            console.error('Error al favoritear:', error);
            // Simular favorito localmente
            this.currentVideo.isFavorited = !this.currentVideo.isFavorited;
            favoriteBtn.classList.toggle('favorited', this.currentVideo.isFavorited);
        }
    }

    // Compartir video
    shareVideo() {
        if (!this.currentVideo) return;

        const shareUrl = `${window.location.origin}/video/${this.currentVideo.id}`;
        const shareText = `Mira "${this.currentVideo.title}" en DreamPlay!`;
        
        if (navigator.share) {
            navigator.share({
                title: this.currentVideo.title,
                text: shareText,
                url: shareUrl,
            });
        } else {
            // Fallback: copiar al portapapeles
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('¡Enlace copiado al portapapeles!');
            });
        }
    }

    // Reproducir siguiente video
    playNextVideo() {
        if (!this.currentVideo || this.videos.length <= 1) return;

        const currentIndex = this.videos.findIndex(v => v.id === this.currentVideo.id);
        const nextIndex = (currentIndex + 1) % this.videos.length;
        
        this.loadVideo(this.videos[nextIndex]);
    }
}

// Inicializar el reproductor cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
});