/**
 * @license MediaSticky
 * Copyright (c) Hidekazu Kubota
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class CardProp {
    constructor(id, data = '', x = 70, y = 70, width = 260, height = 176, bgColor = '#ffffa0', bgOpacity = 1.0) {
        this.id = id;
        this.data = data;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bgColor = bgColor;
        this.bgOpacity = bgOpacity;
    }
}
exports.CardProp = CardProp;
;
//# sourceMappingURL=types.js.map