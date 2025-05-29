/* leaflet.offline.js - Complete implementation for offline tile caching */

(function (L) {
    // Create the offline tile layer extension
    L.TileLayer.Offline = L.TileLayer.extend({
        initialize: function (url, options) {
            L.TileLayer.prototype.initialize.call(this, url, options);
            
            this.options.useCache = options.useCache || false;
            this.options.saveToCache = options.saveToCache || false;
            this.options.cacheDB = options.cacheDB || null;
            this.options.cacheStoreName = options.cacheStoreName || 'offline_tiles';
            this.options.downloadOfflineTiles = options.downloadOfflineTiles || false;
            
            // Create a cache key prefix based on the URL template
            this._cacheKeyPrefix = url.replace(/\{[xyz]\}/g, '');
        },
        
        createTile: function (coords, done) {
            const tile = L.TileLayer.prototype.createTile.call(this, coords, done);
            
            if (this.options.useCache) {
                const key = this._getTileKey(coords);
                
                // Try to get the tile from cache first
                this._getTileFromCache(key).then(cachedUrl => {
                    if (cachedUrl) {
                        // Use cached tile
                        tile.src = cachedUrl;
                        console.log(`[Leaflet.Offline] Using cached tile: ${key}`);
                    } else {
                        // Load from network and cache if needed
                        this._loadTileAndCache(tile, coords, key, done);
                    }
                }).catch(err => {
                    console.error(`[Leaflet.Offline] Error getting tile from cache: ${err}`);
                    // Fall back to network
                    this._loadTileAndCache(tile, coords, key, done);
                });
            }
            
            return tile;
        },
        
        _getTileKey: function (coords) {
            return `${this._cacheKeyPrefix}_${coords.z}_${coords.x}_${coords.y}`;
        },
        
        _getTileFromCache: function (key) {
            if (!this.options.cacheDB) {
                return Promise.resolve(null);
            }
            
            return this.options.cacheDB.get(this.options.cacheStoreName, key)
                .then(entry => {
                    if (entry && entry.url) {
                        return entry.url;
                    }
                    return null;
                })
                .catch(err => {
                    console.error(`[Leaflet.Offline] Error retrieving from cache: ${err}`);
                    return null;
                });
        },
        
        _loadTileAndCache: function (tile, coords, key, done) {
            // Set up the original onload/onerror handlers
            const originalOnLoad = tile.onload;
            const originalOnError = tile.onerror;
            
            // Set the tile URL to the actual URL
            const tileUrl = this.getTileUrl(coords);
            tile.src = tileUrl;
            
            // If we should save to cache
            if (this.options.saveToCache && this.options.cacheDB) {
                tile.onload = (e) => {
                    // Convert the image to a data URL and save to cache
                    this._saveTileToCache(tileUrl, key)
                        .then(() => {
                            console.log(`[Leaflet.Offline] Saved tile to cache: ${key}`);
                        })
                        .catch(err => {
                            console.error(`[Leaflet.Offline] Error saving tile to cache: ${err}`);
                        });
                    
                    // Call the original handler
                    if (originalOnLoad) {
                        originalOnLoad.call(tile, e);
                    }
                    if (done) {
                        done(null, tile);
                    }
                };
                
                tile.onerror = (e) => {
                    // Try to get from cache as fallback
                    this._getTileFromCache(key).then(cachedUrl => {
                        if (cachedUrl) {
                            console.log(`[Leaflet.Offline] Network error, using cached tile: ${key}`);
                            tile.src = cachedUrl;
                            // Don't call the error handler since we recovered
                        } else {
                            // No cached version, call the original error handler
                            if (originalOnError) {
                                originalOnError.call(tile, e);
                            }
                            if (done) {
                                done(e, tile);
                            }
                        }
                    });
                };
            }
        },
        
        _saveTileToCache: function (tileUrl, key) {
            return new Promise((resolve, reject) => {
                // Create a new image to load the tile
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    try {
                        // Create a canvas to convert the image to a data URL
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        // Get the data URL
                        const dataUrl = canvas.toDataURL('image/png');
                        
                        // Save to IndexedDB
                        this.options.cacheDB.put(this.options.cacheStoreName, {
                            key: key,
                            url: dataUrl,
                            timestamp: Date.now()
                        })
                        .then(resolve)
                        .catch(reject);
                    } catch (e) {
                        reject(e);
                    }
                };
                
                img.onerror = reject;
                img.src = tileUrl;
            });
        }
    });
    
    // Factory function
    L.tileLayer.offline = function (url, options) {
        return new L.TileLayer.Offline(url, options);
    };

    // Save Tiles Control
    L.Control.SaveTiles = L.Control.extend({
        options: {
            position: 'topleft',
            saveText: 'Save tiles',
            rmText: 'Remove tiles',
            maxZoom: 19,
            saveWhatYouSee: false,
            bounds: null,
            confirm: null,
            confirmRemoval: null,
            zoomlevels: null, // array of zoom levels to save
            tileLayer: null, // reference to L.tileLayer.offline
            dbName: 'leaflet_offline_tiles'
        },

        initialize: function (baseLayer, options) {
            this._baseLayer = baseLayer;
            L.setOptions(this, options);
            this._dbManager = null;
        },

        onAdd: function (map) {
            this._map = map;
            const container = L.DomUtil.create('div', 'leaflet-control-savetiles leaflet-bar leaflet-control');

            this._createButton(
                this.options.saveText, 
                'leaflet-control-savetiles-save leaflet-bar-part', 
                container, 
                this._saveTiles, 
                this
            );

            this._createButton(
                this.options.rmText, 
                'leaflet-control-savetiles-remove leaflet-bar-part', 
                container, 
                this._rmTiles, 
                this
            );

            return container;
        },

        // Add the openDB method that's expected by the map.js code
        openDB: function() {
            if (!this._dbManager) {
                this._dbManager = new L.TileLayer.DBManager(this.options.dbName);
                
                // Set the cacheDB on the base layer if it's not already set
                if (this._baseLayer && !this._baseLayer.options.cacheDB) {
                    this._baseLayer.options.cacheDB = this._dbManager;
                }
            }
            
            return this._dbManager.open().then(db => {
                console.log("[Leaflet.Offline] Database opened successfully");
                return db;
            });
        },

        _createButton: function (html, className, container, fn, context) {
            const link = L.DomUtil.create('a', className, container);
            link.innerHTML = html;
            link.href = '#';

            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', fn, context)
                .on(link, 'dblclick', L.DomEvent.stopPropagation);

            return link;
        },

        _saveTiles: function () {
            // Make sure DB is open
            this.openDB().then(() => {
                const bounds = this.options.bounds || this._map.getBounds();
                const minZoom = this.options.zoomlevels ? Math.min(...this.options.zoomlevels) : this._map.getZoom();
                const maxZoom = this.options.zoomlevels ? Math.max(...this.options.zoomlevels) : this.options.maxZoom;

                const tilesForSave = this._calculateTilesForArea(bounds, minZoom, maxZoom);
                
                // Add _tilesforSave property for compatibility with the map.js code
                this._tilesforSave = tilesForSave;

                if (this.options.confirm) {
                    this.options.confirm(this, this._saveTilesImpl.bind(this));
                } else {
                    this._saveTilesImpl();
                }
            }).catch(err => {
                console.error("[Leaflet.Offline] Error opening database before saving tiles:", err);
                alert("Could not initialize offline map storage. Offline maps may not be available.");
            });
        },

        _calculateTilesForArea: function (bounds, minZoom, maxZoom) {
            const tiles = [];
            const zoomLevels = this.options.zoomlevels || [minZoom, maxZoom];

            for (let zoom of zoomLevels) {
                if (zoom < minZoom || zoom > maxZoom) continue;

                const northEast = bounds.getNorthEast();
                const southWest = bounds.getSouthWest();
                
                // Convert lat/lng to tile coordinates
                const neTile = this._latLngToTile(northEast.lat, northEast.lng, zoom);
                const swTile = this._latLngToTile(southWest.lat, southWest.lng, zoom);
                
                // Calculate tile range
                const xMin = Math.min(neTile.x, swTile.x);
                const xMax = Math.max(neTile.x, swTile.x);
                const yMin = Math.min(neTile.y, swTile.y);
                const yMax = Math.max(neTile.y, swTile.y);
                
                // Add all tiles in the range
                for (let x = xMin; x <= xMax; x++) {
                    for (let y = yMin; y <= yMax; y++) {
                        tiles.push({
                            x: x,
                            y: y,
                            z: zoom
                        });
                    }
                }
            }

            return tiles;
        },

        _latLngToTile: function (lat, lng, zoom) {
            const n = Math.pow(2, zoom);
            const x = Math.floor((lng + 180) / 360 * n);
            const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
            return { x, y };
        },

        _saveTilesImpl: function (mapName) {
            if (!this._baseLayer.options.cacheDB) {
                console.error('[Leaflet.Offline] No cacheDB provided for saving tiles');
                return;
            }

            // Set the layer to save tiles to cache
            this._baseLayer.options.saveToCache = true;

            // Create a progress counter
            let count = 0;
            const total = this._tilesforSave.length;
            const progress = Math.round(count / total * 100);

            // Trigger progress event
            if (this._baseLayer.fire) {
                this._baseLayer.fire('savestart', {
                    total: total,
                    progress: progress
                });
            }

            // Process tiles in batches to avoid overwhelming the browser
            const processBatch = (startIdx, batchSize) => {
                const endIdx = Math.min(startIdx + batchSize, total);
                
                for (let i = startIdx; i < endIdx; i++) {
                    const tile = this._tilesforSave[i];
                    const url = this._baseLayer.getTileUrl(tile);
                    const key = `${this._baseLayer._cacheKeyPrefix}_${tile.z}_${tile.x}_${tile.y}`;
                    
                    // Create a new image to load the tile
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {
                        try {
                            // Create a canvas to convert the image to a data URL
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            
                            // Get the data URL
                            const dataUrl = canvas.toDataURL('image/png');
                            
                            // Save to IndexedDB
                            this._baseLayer.options.cacheDB.put(this._baseLayer.options.cacheStoreName, {
                                key: key,
                                url: dataUrl,
                                timestamp: Date.now(),
                                mapName: mapName || 'default'
                            })
                            .then(() => {
                                count++;
                                const progress = Math.round(count / total * 100);
                                
                                // Trigger progress event
                                if (this._baseLayer.fire) {
                                    this._baseLayer.fire('saveprogress', {
                                        total: total,
                                        progress: progress
                                    });
                                }
                                
                                // If all tiles are processed, trigger complete event
                                if (count === total) {
                                    if (this._baseLayer.fire) {
                                        this._baseLayer.fire('savecomplete', {
                                            total: total
                                        });
                                    }
                                }
                            })
                            .catch(err => {
                                console.error(`[Leaflet.Offline] Error saving tile to cache: ${err}`);
                                count++;
                            });
                        } catch (e) {
                            console.error(`[Leaflet.Offline] Error processing tile: ${e}`);
                            count++;
                        }
                    };
                    
                    img.onerror = () => {
                        console.error(`[Leaflet.Offline] Error loading tile: ${url}`);
                        count++;
                    };
                    
                    img.src = url;
                }
                
                // Process next batch if there are more tiles
                if (endIdx < total) {
                    setTimeout(() => {
                        processBatch(endIdx, batchSize);
                    }, 100);
                }
            };
            
            // Start processing tiles in batches of 10
            processBatch(0, 10);
        },

        _rmTiles: function () {
            // Make sure DB is open
            this.openDB().then(() => {
                if (this.options.confirmRemoval) {
                    this.options.confirmRemoval(this._rmTilesImpl.bind(this));
                } else {
                    this._rmTilesImpl();
                }
            }).catch(err => {
                console.error("[Leaflet.Offline] Error opening database before removing tiles:", err);
                alert("Could not access offline map storage.");
            });
        },

        _rmTilesImpl: function () {
            if (!this._baseLayer.options.cacheDB) {
                console.error('[Leaflet.Offline] No cacheDB provided for removing tiles');
                return;
            }

            this._baseLayer.options.cacheDB.clear(this._baseLayer.options.cacheStoreName)
                .then(() => {
                    if (this._baseLayer.fire) {
                        this._baseLayer.fire('removecomplete');
                    }
                })
                .catch(err => {
                    console.error(`[Leaflet.Offline] Error clearing cache: ${err}`);
                });
        }
    });

    // Factory function
    L.control.savetiles = function (baseLayer, options) {
        return new L.Control.SaveTiles(baseLayer, options);
    };

    // Simple IndexedDB wrapper for tile storage
    L.TileLayer.DBManager = L.Class.extend({
        initialize: function (dbName) {
            this.dbName = dbName || 'leaflet_offline';
            this._db = null;
        },

        open: function () {
            if (this._db) {
                return Promise.resolve(this._db);
            }

            return new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    reject('IndexedDB not supported');
                    return;
                }

                const request = indexedDB.open(this.dbName, 1);

                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    
                    // Create object store for tiles if it doesn't exist
                    if (!db.objectStoreNames.contains('offline_tiles')) {
                        db.createObjectStore('offline_tiles', { keyPath: 'key' });
                    }
                };

                request.onsuccess = (e) => {
                    this._db = e.target.result;
                    resolve(this._db);
                };

                request.onerror = (e) => {
                    reject(`Error opening IndexedDB: ${e.target.error}`);
                };
            });
        },

        get: function (storeName, key) {
            return this.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);

                    request.onsuccess = (e) => {
                        resolve(e.target.result);
                    };

                    request.onerror = (e) => {
                        reject(`Error getting from IndexedDB: ${e.target.error}`);
                    };
                });
            });
        },

        put: function (storeName, value) {
            return this.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(value);

                    request.onsuccess = (e) => {
                        resolve(e.target.result);
                    };

                    request.onerror = (e) => {
                        reject(`Error putting to IndexedDB: ${e.target.error}`);
                    };
                });
            });
        },

        clear: function (storeName) {
            return this.open().then(db => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onsuccess = (e) => {
                        resolve(e.target.result);
                    };

                    request.onerror = (e) => {
                        reject(`Error clearing IndexedDB: ${e.target.error}`);
                    };
                });
            });
        }
    });

    // Factory function
    L.tileLayer.dbManager = function (dbName) {
        return new L.TileLayer.DBManager(dbName);
    };
    
})(L);
