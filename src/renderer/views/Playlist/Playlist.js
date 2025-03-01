import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/playlist-info/playlist-info.vue'
import FtListVideo from '../../components/ft-list-video/ft-list-video.vue'
import i18n from '../../i18n/index'
import { getLocalPlaylist } from '../../helpers/api/local'
import { extractNumberFromString } from '../../helpers/utils'

export default Vue.extend({
  name: 'Playlist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'playlist-info': PlaylistInfo,
    'ft-list-video': FtListVideo
  },
  data: function () {
    return {
      isLoading: false,
      playlistId: null,
      nextPageRef: '',
      lastSearchQuery: '',
      playlistPage: 1,
      infoData: {},
      playlistItems: []
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    currentLocale: function () {
      return i18n.locale.replace('_', '-')
    }
  },
  watch: {
    $route () {
      // react to route changes...
      this.getPlaylist()
    }
  },
  mounted: function () {
    this.getPlaylist()
  },
  methods: {
    getPlaylist: function () {
      this.playlistId = this.$route.params.id

      switch (this.backendPreference) {
        case 'local':
          this.getPlaylistLocal()
          break
        case 'invidious':
          this.getPlaylistInvidious()
          break
      }
    },
    getPlaylistLocal: function () {
      this.isLoading = true

      getLocalPlaylist(this.playlistId).then((result) => {
        this.infoData = {
          id: this.playlistId,
          title: result.info.title,
          description: result.info.description ?? '',
          firstVideoId: result.items[0].id,
          viewCount: extractNumberFromString(result.info.views),
          videoCount: extractNumberFromString(result.info.total_items),
          lastUpdated: result.info.last_updated ?? '',
          channelName: result.info.author?.name ?? '',
          channelThumbnail: result.info.author?.best_thumbnail?.url ?? '',
          channelId: result.info.author?.id,
          infoSource: 'local'
        }

        this.updateSubscriptionDetails({
          channelThumbnailUrl: this.infoData.channelThumbnail,
          channelName: this.infoData.channelName,
          channelId: this.infoData.channelId
        })

        this.playlistItems = result.items.map((video) => {
          return {
            videoId: video.id,
            title: video.title,
            author: video.author.name,
            authorId: video.author.id,
            lengthSeconds: isNaN(video.duration.seconds) ? '' : video.duration.seconds
          }
        })

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (this.backendPreference === 'local' && this.backendFallback) {
          console.warn('Falling back to Invidious API')
          this.getPlaylistInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistInvidious: function () {
      this.isLoading = true

      const payload = {
        resource: 'playlists',
        id: this.playlistId
      }

      this.invidiousGetPlaylistInfo(payload).then((result) => {
        this.infoData = {
          id: result.playlistId,
          title: result.title,
          description: result.description,
          firstVideoId: result.videos[0].videoId,
          viewCount: result.viewCount,
          videoCount: result.videoCount,
          channelName: result.author,
          channelThumbnail: result.authorThumbnails[2].url.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`),
          channelId: result.authorId,
          infoSource: 'invidious'
        }

        this.updateSubscriptionDetails({
          channelThumbnailUrl: result.authorThumbnails[2].url,
          channelName: this.infoData.channelName,
          channelId: this.infoData.channelId
        })

        const dateString = new Date(result.updated * 1000)
        this.infoData.lastUpdated = dateString.toLocaleDateString(this.currentLocale, { year: 'numeric', month: 'short', day: 'numeric' })

        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          console.warn('Error getting data with Invidious, falling back to local backend')
          this.getPlaylistLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    nextPage: function () {
      const payload = {
        query: this.query,
        options: {
          nextpageRef: this.nextPageRef
        },
        nextPage: true
      }

      this.performSearch(payload)
    },

    replaceShownResults: function (history) {
      this.shownResults = history.data
      this.nextPageRef = history.nextPageRef
      this.isLoading = false
    },

    ...mapActions([
      'invidiousGetPlaylistInfo',
      'updateSubscriptionDetails'
    ])
  }
})
