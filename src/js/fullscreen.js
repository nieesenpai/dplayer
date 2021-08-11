import utils from './utils';

class FullScreen {
    constructor(player) {
        this.player = player;
        this.lastScrollPosition = { left: 0, top: 0 };
        this.player.events.on('webfullscreen', () => {
            this.player.resize();
        });
        this.player.events.on('webfullscreen_cancel', () => {
            this.player.resize();
            utils.setScrollPosition(this.lastScrollPosition);
        });

        const fullscreenchange = () => {
            this.player.resize();
            if (this.isFullScreen('browser')) {
                this.player.events.trigger('fullscreen');
            } else {
                utils.setScrollPosition(this.lastScrollPosition);
                this.player.container.classList.remove('dplayer-fulled-browser');
                this.player.events.trigger('fullscreen_cancel');
            }
        };
        const docfullscreenchange = () => {
            const fullEle = document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
            if (fullEle && fullEle !== this.player.container) {
                return;
            }
            this.player.resize();
            if (fullEle) {
                this.player.events.trigger('fullscreen');
            } else {
                utils.setScrollPosition(this.lastScrollPosition);
                this.player.container.classList.remove('dplayer-fulled-browser');
                this.player.events.trigger('fullscreen_cancel');
            }
        };
        if (/Firefox/.test(navigator.userAgent)) {
            document.addEventListener('mozfullscreenchange', docfullscreenchange);
            document.addEventListener('fullscreenchange', docfullscreenchange);
        } else {
            this.player.container.addEventListener('fullscreenchange', fullscreenchange);
            this.player.container.addEventListener('webkitfullscreenchange', fullscreenchange);
            document.addEventListener('msfullscreenchange', docfullscreenchange);
            document.addEventListener('MSFullscreenChange', docfullscreenchange);
        }
    }

    isFullScreen(type = 'browser') {
        switch (type) {
            case 'browser': {
                const fullEle = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
                if (fullEle && fullEle === this.player.container) {
                    return true;
                } else {
                    return false;
                }
            }
            case 'web': {
                return this.player.container.classList.contains('dplayer-fulled');
            }
        }
    }

    request(type = 'browser') {
        const anotherType = type === 'browser' ? 'web' : 'browser';
        const anotherTypeOn = this.isFullScreen(anotherType);
        if (!anotherTypeOn) {
            this.lastScrollPosition = utils.getScrollPosition();
        }

        switch (type) {
            case 'browser':
                // unify method names
                this.player.container.requestFullscreen =
                    this.player.container.requestFullscreen || // HTML5 standard
                    this.player.container.mozRequestFullScreen || // Gecko
                    this.player.container.webkitRequestFullscreen || // Webkit
                    this.player.container.webkitRequestFullScreen || // Webkit (old)
                    this.player.container.msRequestFullscreen; // Trident
                // request fullscreen
                if (this.player.container.requestFullscreen) {
                    this.player.container.requestFullscreen();
                } else if (this.player.video.webkitEnterFullscreen) {
                    // compatibility: Fullscreen API is not supported in Safari for iOS, so fallback to video.webkitEnterFullscreen()
                    // only the video element is fullscreen, so if fullscreen is enabled you can only use the default controls
                    this.player.video.webkitEnterFullscreen();
                }
                // lock screen to landscape (if supported)
                if (screen.orientation) {
                    try {
                        screen.orientation.lock('landscape').catch(() => {});
                    } catch (e) {
                        // pass
                    }
                }
                // video.webkitEnterFullscreen() does not dispatch the event that exit fullscreen, so the 'dplayer-fulled-browser' class is not added
                if (this.player.container.requestFullscreen) {
                    this.player.container.classList.add('dplayer-fulled-browser');
                }
                break;
            case 'web':
                this.player.container.classList.add('dplayer-fulled');
                document.body.classList.add('dplayer-web-fullscreen-fix');
                this.player.events.trigger('webfullscreen');
                break;
        }

        if (anotherTypeOn) {
            this.cancel(anotherType);
        }
    }

    cancel(type = 'browser') {
        switch (type) {
            case 'browser':
                // unify method names
                document.exitFullscreen =
                    document.exitFullscreen || // HTML5 standard
                    document.mozCancelFullScreen || // Gecko
                    document.webkitExitFullscreen || // Webkit
                    document.webkitCancelFullScreen || // Webkit (old)
                    document.msExitFullscreen; // Trident
                // exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                // unlock screen (if supported)
                if (screen.orientation) {
                    try {
                        screen.orientation.unlock();
                    } catch (e) {
                        // pass
                    }
                }
                this.player.container.classList.remove('dplayer-fulled-browser');
                break;
            case 'web':
                this.player.container.classList.remove('dplayer-fulled');
                document.body.classList.remove('dplayer-web-fullscreen-fix');
                this.player.events.trigger('webfullscreen_cancel');
                break;
        }
    }

    toggle(type = 'browser') {
        if (this.isFullScreen(type)) {
            this.cancel(type);
        } else {
            this.request(type);
        }
    }
}

export default FullScreen;
