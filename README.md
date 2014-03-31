jquery-lazy-scroller
====================

Manages DOM elements of large lists
Virtualizes the scrolling window and removes offscreen elements
    because just lazy loading information into a very large list of DOM elements
    is too slow
Draws empty buffer elements b/c otherwise inertial scrolling
    on a mac can't work
