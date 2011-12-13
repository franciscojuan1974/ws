v0.3.5 - Dec 13th 2011
======================

* Optimized Sender.js, Receiver.js and bufferutil.cc:
 * Apply loop-unrolling-like small block copies rather than use node.js Buffer#copy() (which is slow).
 * Mask blocks of data, instead of single bytes.
 * Keep pre-made send buffer for small transfers.
* Leak fixes and code cleanups.

v0.3.3 - Dec 12th 2011
======================

* Compile fix for Linux.
* Rewrote parts of WebSocket.js, to avoid try/catch and thus avoid optimizer bailouts.

v0.3.2 - Dec 11th 2011
======================

* Further performance updates, including the additions of a native BufferUtil module, which deals with several of the cpu intensive WebSocket operations.

v0.3.1 - Dec 8th 2011
======================

* Service release, fixing broken tests.

v0.3.0 - Dec 8th 2011
======================

* Node.js v0.4.x compatibility.
* Code cleanups and efficiency improvements.
* WebSocket server added, although this will still mainly be a client library.
* WebSocket server certified to pass the Autobahn test suite.
* Protocol improvements and corrections - such as handling (redundant) masks for empty fragments.
* 'wscat' command line utility added, which can act as either client or server.

v0.2.6 - Dec 3rd 2011
======================

* Renamed to 'ws'. Big woop, right -- but easy-websocket really just doesn't cut it anymore!

v0.2.5 - Dec 3rd 2011
======================

  * Rewrote much of the WebSocket parser, to ensure high speed for highly fragmented messages.
  * Added a BufferPool, as a start to more efficiently deal with allocations for WebSocket connections. More work to come, in that area.
  * Updated the Autobahn report, at http://einaros.github.com/easy-websocket, with comparisons against WebSocket-Node 1.0.2 and Chrome 16.

v0.2.0 - Nov 25th 2011
======================

  * Major rework to make sure all the Autobahn test cases pass. Also updated the internal tests to cover more corner cases.

v0.1.2 - Nov 14th 2011
======================

  * Back and forth, back and forth: now settled on keeping the api (event names, methods) closer to the websocket browser api. This will stick now.
  * Started keeping this history record. Better late than never, right?