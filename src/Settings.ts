import Manifest from './Manifest';

export default class Settings {

  // The manifest object to use, if you want to skip the serial call to fetch the xml.
  public manifest: Manifest = null;

  // Default start time for video, in seconds.
  public startTime = 0;

  // If auto bitrate regulation is enabled.
  public isABREnabled = true;

  // Randomize bitrate (testing purposes)
  public isRBREnabled = false;

  // The quality to use if we have ABR disabled, or if default bandwidth is not available.
  public targetQuality: { [key: string]: number } = {
    audio: 2,
    video: 2
  };

  // If we should auto play the video when enough buffer is available.
  public shouldAutoPlay = true;

  // Logs debug data to console.
  public logToConsole = false;

  // Number of buffered seconds in which we will start to be more aggressive on estimates.
  public safeBufferSeconds = 12;

  // Number of buffered seconds before we stop buffering more.
  public maxBufferSeconds = 119.5;

  // Max number of simultaneous requests per stream.
 public maxConcurrentRequests: { [key: string]: number } = {
    audio: 4,
    video: 6
  };

  // Max number of fragments each stream can be ahead of the other stream by.
  public maxSegmentLeadCount: { [key: string]: number } = {
    audio: 1,
    video: 5
  };

  // Default bytes per millisecond, used to determine default request staggering (480p is around 520 bytes per millisecond (4.16 mbps.)
  public defaultBandwidth = 520;

  // Default request timeout
  public requestTimeout = 30000;

  // Number of attempts beyond original request to try downloading something.
  public maxRetries = 3;

  // Millisecond delays between retries.
  public delaysBetweenRetries = [200, 1500, 3000];

  // Milliseconds that a request must be to register as a "download" that triggers the download event (used for ignoring cache responses.)
  public requestCacheThreshold = 80;

  // Optional override for manifest baseurl.
  public baseUrlOverride: string = null;

}
