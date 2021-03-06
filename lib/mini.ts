import qs from 'qs';

// 小程序相关方法
const Mini = {
  /**
   * 返回上一个页面
   */
  navigateBack() {
    let key = 0;
    if (window && window.my && window.my.navigateBack) {
      key++;
      window.my.navigateBack();
    }

    if (window && window.wx && window.wx.miniProgram && window.wx.miniProgram.navigateBack) {
      key++;
      window.wx.miniProgram.navigateBack();
    }

    if (window && window.jd && window.jd.miniProgram && window.jd.miniProgram.navigateBack) {
      key++;
      window.jd.miniProgram.navigateBack();
    }

    if (key === 0) {
      window.history.back();
    }
  },

  /**
   * 跳转原生页面
   */
  navigateTo(url: string) {
    if (!url) {
      return;
    }

    if (
      url.startsWith('/pages/home/index') ||
      url.startsWith('/pages/user/index') ||
      url.startsWith('/pages/order/index')
    ) {
      Mini.switchTab(url);
      return;
    }

    if (window && window.my && window.my.navigateTo) {
      window.my.navigateTo({ url });
    }

    if (window && window.wx && window.wx.miniProgram && window.wx.miniProgram.navigateTo) {
      window.wx.miniProgram.navigateTo({ url });
    }

    if (window && window.jd && window.jd.miniProgram && window.jd.miniProgram.navigateTo) {
      window.jd.miniProgram.navigateTo({ url });
    }
  },

  /**
   * 跳转原生Tab
   */
  switchTab(url: string) {
    if (window && window.my && window.my.switchTab) {
      window.my.switchTab({ url });
    }

    if (window && window.wx && window.wx.miniProgram && window.wx.miniProgram.switchTab) {
      window.wx.miniProgram.switchTab({ url });
    }

    if (window && window.jd && window.jd.miniProgram && window.jd.miniProgram.switchTab) {
      window.jd.miniProgram.switchTab({ url });
    }
  },

  /**
   * postMessage
   */
  postMessage(data: any) {
    if (window && window.my && window.my.postMessage) {
      window.my.postMessage(data);
    }

    if (window && window.wx && window.wx.miniProgram && window.wx.miniProgram.postMessage) {
      window.wx.miniProgram.postMessage(data);
    }

    if (window && window.jd && window.jd.miniProgram && window.jd.miniProgram.postMessage) {
      window.jd.miniProgram.postMessage(data);
    }
  },

  /**
   * 跳转原生页面(关闭当前页面)
   */
  redirectTo(url: string) {
    if (window && window.my && window.my.redirectTo) {
      window.my.redirectTo({ url });
    }

    if (window && window.wx && window.wx.miniProgram && window.wx.miniProgram.redirectTo) {
      window.wx.miniProgram.redirectTo({ url });
    }

    if (window && window.jd && window.jd.miniProgram && window.jd.miniProgram.redirectTo) {
      window.jd.miniProgram.redirectTo({ url });
    }
  },

  /**
   * 跳转原生页面(关闭当前所有页面)
   */
  reLaunch(url: string) {
    if (window && window.my && window.my.reLaunch) {
      window.my.reLaunch({ url });
    }

    if (window && window.wx && window.wx.miniProgram && window.wx.miniProgram.reLaunch) {
      window.wx.miniProgram.reLaunch({ url });
    }

    if (window && window.jd && window.jd.miniProgram && window.jd.miniProgram.reLaunch) {
      window.jd.miniProgram.reLaunch({ url });
    }
  },

  /**
   * 打开小程序的webview
   */
  openWebview(url: string, query?: Record<string, any>) {
    if (!url) {
      return;
    }

    let baseUrl = '/pages/pageCommon/webView/index';
    const split = url.split('?');
    let params: any = query;
    if (split[1]) {
      params = { ...params, ...qs.parse(split[1]) };
    }

    baseUrl = `${baseUrl}?urlParams=${JSON.stringify({
      src: split[0].indexOf('http') === 0 ? split[0] : window.location.origin + split[0],
      paramsObj: params,
    })}`;

    Mini.navigateTo(baseUrl);
  },

  /**
   * h5调用小程序的授权登录
   */
  authLogin(redirect?: string) {
    if (redirect) {
      Mini.navigateTo(
        `/pages/pageCommon/fastLogin/index?redirectUrl=${encodeURIComponent(redirect)}`,
      );
    } else {
      Mini.navigateTo('/pages/pageCommon/fastLogin/index');
    }
  },
};

export default Mini;
