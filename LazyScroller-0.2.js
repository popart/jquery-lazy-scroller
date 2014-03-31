/** Lazy Scroller 
    v.0.2 - Limits DOM elements to what's visible
            and what's needed to provide room for inertial scroll
    opts {
        scrollContainer  : element //main container, 
        contentContainer : element //where the tiles go,
        data             : JSON data,
        numCols          : Int //# of items wide,
        template         : jquery template,
        tileHeight       : Int //measure the diff b/t two item.offset().top
                           (sorry, can't get dom attrs from <script> tmpl)
        beforeLoad       : function(itemData: JSON),
        afterLoad        : function(itemData: JSON, itemTile: html),
        emptyTileClass   : String
        bufferSize       : # of tiles needed outside of scroll visibility
                           (for inertial scrolling)
    }
*/

LazyScroller = function(opts) { 
    var scrollContainer = opts.scrollContainer
    if(opts.contentContainer) {
        var contentContainer = opts.contentContainer
    } else {
        var contentContainer = $('<div>')
        contentContainer.addClass('contentContainer')
        scrollContainer.append(contentContainer)
    }
    contentContainer.css('overflow', 'hidden') //hides buffer at end of list

    if(opts.windowContainer) {
        var windowContainer = opts.windowContainer
    } else {
        var windowContainer = $('<div>')
        windowContainer.addClass('windowContainer')
        contentContainer.append(windowContainer)
    }

    var items = opts.data
    var template = opts.template
    var numCols = opts.numCols || 1

    var HIDDEN_OFFSET = _getHiddenOffset(scrollContainer) //may not necessarily be a constant
    var BASE_CEILING = _getCeiling()

    var TILE_HEIGHT = opts.tileHeight
    var START_TOP = contentContainer.offset().top
    var HEIGHT_DIFF = START_TOP - BASE_CEILING

    var BUFFER_SIZE = opts.bufferSize || 50

    var EMPTY_TILE_CLASS = opts.emptyTileClass || ''

    if (opts.beforeLoad) {
        setBeforeLoad(opts.beforeLoad)
    }
    if (opts.afterLoad) {
        setAfterLoad(opts.afterLoad)
    }

    contentContainer.height(Math.ceil(items.length/numCols)*TILE_HEIGHT)
    var currentItemIndices = []

    _setWindowOffset()
    _lazyLoad()

    opts.scrollContainer.scroll(function() {
        _setWindowOffset()
        _lazyLoad()
    })


    function _getHiddenOffset(container) {
        var borderTopWidth = Number(scrollContainer.css('border-top-width').match(/\d+/))
        var paddingTop = Number(scrollContainer.css('padding-top').match(/\d+/))
        return borderTopWidth + paddingTop
    }

    function _getCeiling() {
        return scrollContainer.offset().top + HIDDEN_OFFSET
    }

    function _setWindowOffset() {
        windowContainer.offset({
            top:  contentContainer.offset().top 
                + scrollContainer.scrollTop()
                - scrollContainer.scrollTop() % TILE_HEIGHT
                - (BUFFER_SIZE*TILE_HEIGHT) / numCols,
            left: contentContainer.offset().left
        })
    }

    function _lazyLoad() {
        var ceiling = _getCeiling()
        var floor = ceiling+scrollContainer.height()
        var scrollTop = scrollContainer.scrollTop()
        var movement = ceiling - BASE_CEILING

        var newItemIndices = []

        for(var i=0; i<items.length; i++) {
            var tileTop = START_TOP 
                        - scrollTop 
                        + HEIGHT_DIFF 
                        + ~~(i/numCols)*(TILE_HEIGHT) 
                        + movement
            var tileBottom = tileTop + TILE_HEIGHT

            if (floor > tileTop) {
                if (ceiling < tileBottom) {
                    newItemIndices.push(i)
                } 
            } else break;
        }

        if(newItemIndices.length > 0) {
            var firstIndex = newItemIndices[0]
            var lastIndex = newItemIndices[newItemIndices.length-1]
            for(var i = 1; i <= BUFFER_SIZE; i++) {
                newItemIndices.unshift(firstIndex-i)
                newItemIndices.push(lastIndex+i)
            }
        }

        var toRemove = currentItemIndices.slice()
        var toAdd = newItemIndices.slice()

        for(var i in newItemIndices) {
            var removeMatchIndex = toRemove.indexOf(newItemIndices[i])
            var addMatchIndex = toAdd.indexOf(newItemIndices[i])

            if(removeMatchIndex >=0) {
                toRemove.splice(removeMatchIndex, 1)
                if(addMatchIndex >=0) {
                    toAdd.splice(addMatchIndex, 1)
                }
            }
        }


        for(var i in toRemove) {
            windowContainer.children('[index='+toRemove[i]+']').remove()
        }

        var pre = []

        for(var n in toAdd) {
            var i = toAdd[n]
            if(i < 0 || i >= items.length) { //empty tiles
                var tile = $('<div>')
                tile.addClass(EMPTY_TILE_CLASS)
                tile.attr('index', i)
            } else {
                beforeLoad(items[i], i)
                items[i]['index']=i
                var tile = template.tmpl(items[i])
                tile.attr('index', i)
            }
            if(i > (currentItemIndices[0] || -1)) {
                windowContainer.append(tile)
            } else {
                pre.push(tile)
            }

            if(i >= 0  && i < items.length) {
                afterLoad(items[i], tile, i)
            }
        }

        pre.reverse()
        for(var i in pre) {
            windowContainer.prepend(pre[i])
        }

        currentItemIndices = newItemIndices.slice()
    }

    function getData() {
        return opts.data
    }

    function resetData(data) {
        items = data

        contentContainer.height(Math.ceil(items.length/numCols)*TILE_HEIGHT)
        scrollContainer.scrollTop(0)

        windowContainer.html('')
        currentItemIndices = []
    }

    function beforeLoad(itemData, index) {}
    function afterLoad(itemData, itemTile, index) {}

    function setBeforeLoad(fun) {
        beforeLoad = fun
    }
    function setAfterLoad(fun) {
        afterLoad = fun
    }

    return {
        resetData: resetData
        , getData: getData
        , setBeforeLoad: setBeforeLoad
        , setAfterLoad: setAfterLoad
        , reload: _lazyLoad
    }
    
}
