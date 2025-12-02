// 音乐播放器控制逻辑

// 播放列表数据 - 使用更可靠的音频源
// 播放列表数据 - 替换为用户提供的本地音频文件
const playlist = [
    {
        id: 1,
        title: 'How Are You',
        artist: '梁老师Tsong',
        duration: '02:58',
        albumImg: 'https://picsum.photos/400/400?random=1',
        audioSrc: './M500003RFtUR0BOBnU.mp3'
    },
    {
        id: 2,
        title: '70%',
        artist: 'GALI',
        duration: '03:34',
        albumImg: 'https://picsum.photos/400/400?random=2',
        audioSrc: './M800000nFHQO4XPMpX.mp3'
    },
    {
        id: 3,
        title: '很高兴认识你',
        artist: 'C-BLOCK',
        duration: '03:52',
        albumImg: 'https://picsum.photos/400/400?random=4',
        audioSrc: './M500001FkHdq3lZBw1.mp3'
    }
];

// DOM元素 - 确保所有必要的DOM元素引用都被定义
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.querySelector('.play-btn');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const repeatBtn = document.querySelector('.repeat-btn');
const volumeBtn = document.querySelector('.volume-btn');
const volumeSlider = document.querySelector('.volume-slider');
const albumCover = document.querySelector('.album-cover');
const progressBar = document.querySelector('.progress');
const progressHandle = document.querySelector('.progress-handle');
const progressContainer = document.querySelector('.progress-container');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const songTitleEl = document.getElementById('songTitle');
const artistNameEl = document.getElementById('artistName');
const albumImgEl = document.getElementById('albumImg');
const playlistEl = document.getElementById('playlist');
const playlistToggle = document.querySelector('.playlist-toggle');
const playlistContainer = document.querySelector('.playlist-container');

// 播放器状态
let currentSongIndex = 0;
let isPlaying = false;
let repeatMode = 0; // 0: 不循环, 1: 单曲循环, 2: 列表循环
let isDragging = false;
let playlistVisible = true;

// 初始化函数
function init() {
    // 渲染播放列表
    renderPlaylist();
    
    // 加载第一首歌曲
    loadSong(currentSongIndex);
    
    // 事件监听
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    repeatBtn.addEventListener('click', toggleRepeatMode);
    volumeSlider.addEventListener('input', adjustVolume);
    progressContainer.addEventListener('click', scrub);
    progressHandle.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    
    // 增强的音频事件监听
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', onMetadataLoaded);
    audioPlayer.addEventListener('canplay', onCanPlay);
    audioPlayer.addEventListener('play', onPlay);
    audioPlayer.addEventListener('pause', onPause);
    
    playlistToggle.addEventListener('click', togglePlaylist);
    
    // 初始化音量
    audioPlayer.volume = volumeSlider.value || 0.8;
    
    // 添加错误处理
    audioPlayer.addEventListener('error', function(e) {
        console.error('音频播放错误:', e);
        console.error('错误代码:', e.target.error.code);
        
        // 详细的错误代码解释
        let errorDetails = '';
        switch(e.target.error.code) {
            case 1: errorDetails = '音频加载被中止'; break;
            case 2: errorDetails = '网络错误'; break;
            case 3: errorDetails = '解码错误'; break;
            case 4: errorDetails = 'URL无效'; break;
            default: errorDetails = '未知错误';
        }
        
        const errorMessages = [
            `音频加载失败: ${errorDetails}`,
            `可能是网络问题或CORS限制，请检查网络连接`,
            '音频文件不可用，请点击其他歌曲试试'
        ];
        const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        alert(randomMessage);
        pauseSong();
    });
    
    // 添加canplaythrough事件，表示音频可以流畅播放
    audioPlayer.addEventListener('canplaythrough', function() {
        console.log('音频已加载完成，可以流畅播放');
    });
    
    // 添加加载状态事件
    audioPlayer.addEventListener('loadstart', function() {
        console.log('开始加载音频...');
    });
    
    audioPlayer.addEventListener('progress', function() {
        if (audioPlayer.buffered.length > 0) {
            const bufferedPercent = (audioPlayer.buffered.end(audioPlayer.buffered.length - 1) / audioPlayer.duration) * 100;
            console.log('音频缓冲进度:', bufferedPercent.toFixed(2) + '%');
        }
    });
    
    // 提示用户点击播放按钮开始
    console.log('播放器已初始化，请点击播放按钮开始播放音乐');
    
    // 确保进度条元素存在
    if (!progressBar || !progressHandle) {
        console.error('进度条元素未找到');
    }
}

// 元数据加载完成事件处理
function onMetadataLoaded() {
    console.log('音频元数据已加载，总时长:', audioPlayer.duration);
    if (!isNaN(audioPlayer.duration)) {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }
}

// 可以播放事件处理
function onCanPlay() {
    console.log('音频可以开始播放');
}

// 播放事件处理
function onPlay() {
    console.log('音频开始播放');
    isPlaying = true;
}

// 暂停事件处理
function onPause() {
    console.log('音频暂停播放');
    isPlaying = false;
}

// 渲染播放列表
function renderPlaylist() {
    playlistEl.innerHTML = '';
    
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('playlist-item');
        if (index === currentSongIndex) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <div class="playlist-song-info">
                <div class="playlist-song-title">${song.title}</div>
                <div class="playlist-artist-name">${song.artist}</div>
            </div>
            <div class="playlist-duration">${song.duration}</div>
        `;
        
        li.addEventListener('click', () => {
            console.log('点击播放列表项:', index);
            if (index !== currentSongIndex) {
                currentSongIndex = index;
                loadSong(currentSongIndex);
                if (isPlaying) {
                    playSong();
                }
            } else if (!isPlaying) {
                playSong();
            }
        });
        
        playlistEl.appendChild(li);
    });
}

// 加载歌曲
function loadSong(index) {
    console.log('加载歌曲:', index);
    const song = playlist[index];
    
    // 更新UI
    songTitleEl.textContent = song.title;
    artistNameEl.textContent = song.artist;
    albumImgEl.src = song.albumImg;
    totalTimeEl.textContent = song.duration;
    
    // 更新播放列表选中状态
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => item.classList.remove('active'));
    if (playlistItems[index]) {
        playlistItems[index].classList.add('active');
    }
    
    // 确保audio元素存在
    if (!audioPlayer) {
        console.error('音频元素未找到');
        return;
    }
    
    // 重置并加载实际音频源
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.src = song.audioSrc;
    
    // 尝试预加载
    audioPlayer.load();
    console.log('音频源已设置:', song.audioSrc);
    
    // 重置进度条
    progressBar.style.width = '0%';
    currentTimeEl.textContent = '00:00';
}

// 播放/暂停切换
function togglePlay() {
    console.log('切换播放状态:', !isPlaying);
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

// 播放歌曲
function playSong() {
    console.log('播放歌曲:', playlist[currentSongIndex].title);
    isPlaying = true;
    playBtn.classList.add('playing');
    albumCover.classList.add('playing');
    
    // 实际播放音频
    if (audioPlayer) {
        audioPlayer.play().then(() => {
            console.log('播放成功');
        }).catch(error => {
            console.error('播放失败:', error);
            // 尝试恢复播放（可能是由于浏览器策略限制）
            setTimeout(() => {
                audioPlayer.play().catch(e => console.error('再次尝试播放失败:', e));
            }, 100);
        });
    }
}

// 暂停歌曲
function pauseSong() {
    console.log('暂停歌曲:', playlist[currentSongIndex].title);
    isPlaying = false;
    playBtn.classList.remove('playing');
    albumCover.classList.remove('playing');
    
    // 实际暂停音频
    if (audioPlayer) {
        audioPlayer.pause();
    }
}

// 播放上一首
function playPrevious() {
    console.log('播放上一首');
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = playlist.length - 1;
    }
    loadSong(currentSongIndex);
    if (isPlaying) {
        playSong();
    }
}

// 播放下一首
function playNext() {
    console.log('播放下一首');
    currentSongIndex++;
    if (currentSongIndex >= playlist.length) {
        currentSongIndex = 0;
    }
    loadSong(currentSongIndex);
    if (isPlaying) {
        playSong();
    }
}

// 切换循环模式
function toggleRepeatMode() {
    repeatMode = (repeatMode + 1) % 3;
    
    // 更新循环按钮图标
    let icon = '';
    switch (repeatMode) {
        case 0:
            icon = '🔁';
            repeatBtn.title = '不循环';
            break;
        case 1:
            icon = '🔂';
            repeatBtn.title = '单曲循环';
            break;
        case 2:
            icon = '🔄';
            repeatBtn.title = '列表循环';
            break;
    }
    repeatBtn.querySelector('.icon').textContent = icon;
}

// 调整音量
function adjustVolume() {
    const volume = volumeSlider.value;
    if (audioPlayer) {
        audioPlayer.volume = volume;
    }
    
    // 更新音量图标
    let icon = '';
    if (volume > 0.7) {
        icon = '🔊';
    } else if (volume > 0) {
        icon = '🔉';
    } else {
        icon = '🔇';
    }
    volumeBtn.querySelector('.icon').textContent = icon;
}

// 更新进度条 - 增强版本
function updateProgress() {
    if (isDragging || !audioPlayer) return;
    
    // 使用实际音频数据更新进度
    const { duration, currentTime } = audioPlayer;
    
    // 添加详细日志
    console.log('更新进度 - 当前时间:', currentTime, '总时长:', duration);
    
    if (isNaN(duration)) {
        console.warn('音频总时长不可用');
        return; // 确保duration有效
    }
    
    const progressPercent = (currentTime / duration) * 100;
    console.log('进度百分比:', progressPercent);
    
    // 更新进度条显示
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
    }
    
    // 更新时间显示
    currentTimeEl.textContent = formatTime(currentTime);
    totalTimeEl.textContent = formatTime(duration);
    
    // 更新进度手柄位置
    updateProgressHandle();
}

// 进度条点击跳转
function scrub(e) {
    if (isDragging || !audioPlayer) return;
    
    const scrubTime = (e.offsetX / progressContainer.offsetWidth);
    progressBar.style.width = `${scrubTime * 100}%`;
    
    // 更新音频播放位置
    if (audioPlayer.duration) {
        audioPlayer.currentTime = scrubTime * audioPlayer.duration;
        console.log('跳转播放位置:', audioPlayer.currentTime);
    }
    
    updateProgressHandle();
}

// 开始拖动进度条
function startDragging(e) {
    isDragging = true;
    progressHandle.style.opacity = 1;
    e.preventDefault();
}

// 拖动进度条
function drag(e) {
    if (!isDragging) return;
    
    const rect = progressContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    
    // 限制在进度条范围内
    x = Math.max(0, Math.min(x, rect.width));
    
    const percent = (x / rect.width) * 100;
    progressBar.style.width = `${percent}%`;
    
    updateProgressHandle();
}

// 停止拖动进度条
function stopDragging() {
    if (!isDragging || !audioPlayer) return;
    
    isDragging = false;
    
    // 更新音频播放位置
    const percent = parseFloat(progressBar.style.width) / 100;
    if (audioPlayer.duration) {
        audioPlayer.currentTime = percent * audioPlayer.duration;
        console.log('拖动后设置播放位置:', audioPlayer.currentTime);
    }
}

// 更新进度手柄位置
function updateProgressHandle() {
    const width = parseFloat(progressBar.style.width);
    progressHandle.style.left = `${width}%`;
}

// 处理歌曲结束
function handleSongEnd() {
    console.log('歌曲播放结束');
    switch (repeatMode) {
        case 0: // 不循环
            if (currentSongIndex < playlist.length - 1) {
                playNext();
            } else {
                pauseSong();
                if (audioPlayer) {
                    audioPlayer.currentTime = 0;
                }
            }
            break;
        case 1: // 单曲循环
            // 重置并重新播放当前歌曲
            if (audioPlayer) {
                audioPlayer.currentTime = 0;
                audioPlayer.play().catch(error => console.log('单曲循环播放失败:', error));
            }
            break;
        case 2: // 列表循环
            playNext();
            break;
    }
}

// 切换播放列表显示
function togglePlaylist() {
    playlistVisible = !playlistVisible;
    playlistContainer.style.display = playlistVisible ? 'block' : 'none';
}

// 格式化时间
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 初始化播放器
window.addEventListener('DOMContentLoaded', init);