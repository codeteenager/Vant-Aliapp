"use strict";

var _page = _interopRequireDefault(require("../../common/page"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(0, _page["default"])({
  data: {
    activeTab: 0
  },
  onChange: function onChange(event) {
    this.setData({
      activeTab: event.detail.name
    });
  }
});