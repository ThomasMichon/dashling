define(["require", "exports", './Settings', './StreamController', './DashlingEnums', './ManifestParser', './EventGroup'], function (require, exports, Settings_1, StreamController_1, DashlingEnums_1, ManifestParser_1, EventGroup_1) {
    var _sessionCount = 0;
    var Dashling = (function () {
        function Dashling(settings) {
            /** Exported enums for simplifying access externally. */
            this.Event = DashlingEnums_1.DashlingEvent;
            this.SessionState = DashlingEnums_1.DashlingSessionState;
            this.RequestState = DashlingEnums_1.DashlingRequestState;
            this.isDisposed = false;
            this._events = new EventGroup_1.default(this);
            this.settings = settings || new Settings_1.default();
            this.reset();
        }
        /** Disposes dashling. */
        Dashling.prototype.dispose = function () {
            if (!this.isDisposed) {
                this.isDisposed = true;
                this._events.dispose();
                this.reset();
            }
        };
        /** Add/remove eventlistener stubs for backwards compatibility. */
        Dashling.prototype.addEventListener = function (eventName, callback) {
            this._events.on(this, eventName, callback);
        };
        Dashling.prototype.removeEventListener = function (eventName, callback) {
            this._events.off(this, eventName, callback);
        };
        /** Loads a given video. */
        Dashling.prototype.load = function (videoElement, url) {
            this.reset();
            this._sessionIndex = ++_sessionCount;
            this.startTime = new Date().getTime();
            this._setState(DashlingEnums_1.DashlingSessionState.initializing);
            this.videoElement = videoElement;
            this._initializeMediaSource(videoElement);
            this._initializeManifest(url);
        };
        /** Resets the dashling state. */
        Dashling.prototype.reset = function () {
            this.timeAtFirstCanPlay = null;
            this.startTime = null;
            this.lastError = null;
            if (this.streamController) {
                this.streamController.dispose();
                this.streamController = null;
            }
            if (this._parser) {
                this._parser.dispose();
                this._parser = null;
            }
            if (this.videoElement) {
                this.settings.manifest = null;
                try {
                    this.videoElement.pause();
                }
                catch (e) { }
                this.videoElement = null;
            }
            this._mediaSource = null;
            this._setState(DashlingEnums_1.DashlingSessionState.idle);
        };
        /** Abort all downloads and clear all buffers, useful if you want to reset and re-download */
        Dashling.prototype.resetStreams = function () {
            if (this.streamController) {
                this.streamController.reset(true, true);
            }
        };
        Dashling.prototype.getRemainingBuffer = function () {
            return this.streamController ? this.streamController.getRemainingBuffer() : 0;
        };
        Dashling.prototype.getBufferRate = function () {
            return this.streamController ? this.streamController.getBufferRate() : 0;
        };
        Dashling.prototype.getPlayingQuality = function (streamType) {
            return this.streamController ? this.streamController.getPlayingQuality(streamType) : this.settings.targetQuality[streamType];
        };
        Dashling.prototype.getBufferingQuality = function (streamType) {
            return this.streamController ? this.streamController.getBufferingQuality(streamType) : this.settings.targetQuality[streamType];
        };
        Dashling.prototype.getMaxQuality = function (streamType) {
            var stream = this.settings.manifest ? this.settings.manifest.streams[streamType] : null;
            return stream ? stream.qualities.length - 1 : 0;
        };
        Dashling.prototype._setState = function (state, errorType, errorMessage) {
            if (!this.isDisposed && this.state !== state) {
                this.state = state;
                this.lastErrorType = errorType;
                this.lastErrorMessage = errorMessage;
                this.lastError = errorType ? (errorType + " " + (errorMessage ? "(" + errorMessage + ")" : "")) : null;
                // Stop stream controller immediately.
                if (state === DashlingEnums_1.DashlingSessionState.error && this.streamController) {
                    this.streamController.dispose();
                }
                if (!this.timeAtFirstCanPlay && (state == DashlingEnums_1.DashlingSessionState.playing || state == DashlingEnums_1.DashlingSessionState.paused)) {
                    this.timeAtFirstCanPlay = new Date().getTime() - this.startTime;
                }
                this._events.raise(DashlingEnums_1.DashlingEvent.sessionStateChange, {
                    state: state,
                    errorType: errorType,
                    errorMessage: errorMessage
                });
                if (this.videoElement) {
                    switch (state) {
                        case DashlingEnums_1.DashlingSessionState.initializing:
                        case DashlingEnums_1.DashlingSessionState.buffering:
                            EventGroup_1.default.raise(this.videoElement, 'waiting', null);
                            break;
                        case DashlingEnums_1.DashlingSessionState.playing:
                            EventGroup_1.default.raise(this.videoElement, 'playing', null);
                            break;
                        case DashlingEnums_1.DashlingSessionState.error:
                            EventGroup_1.default.raise(this.videoElement, 'error', null);
                            break;
                    }
                }
            }
        };
        Dashling.prototype._initializeMediaSource = function (videoElement) {
            var _this = this;
            var sessionIndex = _this._sessionIndex;
            var mediaSource;
            try {
                mediaSource = new MediaSource();
            }
            catch (e) {
                _this._setState(DashlingEnums_1.DashlingSessionState.error, DashlingEnums_1.DashlingError.mediaSourceInit);
            }
            if (mediaSource) {
                mediaSource.addEventListener("sourceopen", _onOpened, false);
                videoElement.src = URL.createObjectURL(mediaSource);
            }
            function _onOpened() {
                mediaSource.removeEventListener("sourceopen", _onOpened);
                if (_this._sessionIndex === sessionIndex) {
                    _this._mediaSource = mediaSource;
                    _this._tryStart();
                }
            }
        };
        Dashling.prototype._initializeManifest = function (url) {
            var _this = this;
            var sessionIndex = this._sessionIndex;
            var onParserSuccess = function (manifest) {
                if (_this._sessionIndex === sessionIndex && _this.state !== DashlingEnums_1.DashlingSessionState.error) {
                    _this.settings.manifest = manifest;
                    _this._tryStart();
                }
            };
            var onParserError = function (errorType, errorMessage) {
                if (_this._sessionIndex === sessionIndex) {
                    _this._setState(DashlingEnums_1.DashlingSessionState.error, errorType, errorMessage);
                }
            };
            if (this.settings.manifest) {
                onParserSuccess(this.settings.manifest);
            }
            else {
                var parser = this._parser = new ManifestParser_1.default(this.settings);
                parser.parse(url, onParserSuccess, onParserError);
            }
        };
        Dashling.prototype._tryStart = function () {
            var _this = this;
            if (this.state !== DashlingEnums_1.DashlingSessionState.error &&
                this._mediaSource &&
                this.settings.manifest) {
                this._mediaSource.duration = this.settings.manifest.mediaDuration;
                this.streamController = new StreamController_1.default(this.videoElement, this._mediaSource, this.settings);
                // TODO forward download events from steamcontroller out?
                this._events.on(this.streamController, DashlingEnums_1.DashlingEvent.sessionStateChange, function (ev) {
                    _this._setState(ev.state, ev.errorType, ev.errorMessage);
                });
                this.streamController.start();
            }
        };
        return Dashling;
    })();
    exports.default = Dashling;
});
