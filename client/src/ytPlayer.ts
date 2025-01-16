export function YTPlayer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ytPlayer } = window as any;

  return {
    loadVideoById: (videoId: string, time: number) => {
      if (!ytPlayer) return;
      ytPlayer.loadVideoById(videoId, time);
    },
    playVideo: () => {
      if (!ytPlayer) return;
      ytPlayer.playVideo();
    },
    pauseVideo: () => {
      if (!ytPlayer) return;
      ytPlayer.pauseVideo();
    },
    seekTo: (seconds: number) => {
      if (!ytPlayer) return;
      ytPlayer.seekTo(seconds, true);
    },
    setVolume: (volume: number) => {
      if (!ytPlayer) return;
      ytPlayer.setVolume(volume);
    },
    getVolume: () => {
      if (!ytPlayer) return;
      return ytPlayer.getVolume();
    },
    currentVideoId: () => {
      if (!ytPlayer) return;
      return ytPlayer.playerInfo?.videoData?.video_id;
    },
    currentTime: () => {
      if (!ytPlayer) return;
      return ytPlayer.getCurrentTime();
    },
  };
}
