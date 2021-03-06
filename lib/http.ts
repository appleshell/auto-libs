import axios, { AxiosAdapter } from 'axios';
import Cookie from 'js-cookie';
import { clearToken, getToken, toLogin } from './token';
import report from './utils/analyticsReport';

interface HttpConfig {
  resCode?: string;
  resMsg?: string;
  data?: any;
}

export interface ProcessEnv {
  [key: string]: string | undefined;
}

class HttpError extends Error {
  public msg: string;
  public name = 'HttpError';
  public data: any;
  public code = '0';
  public constructor(message: string, data?: HttpConfig) {
    super(message);

    this.msg = message;
    if (data) {
      this.data = data ? (data.data ? data.data : data) : null;
      this.code = data.resCode || '';
    }
  }

  public toString() {
    return this.message;
  }
}

// 用户唯一id
let uuid = localStorage.getItem('_app_uuid_');
if (!uuid) {
  uuid = String(new Date().valueOf()) + Math.round(Math.random() * 9999);
  localStorage.setItem('_app_uuid_', uuid);
}

/**
 * 配置axios
 */
export const http = axios.create({
  baseURL: '/',
  headers: {
    Accept: 'application/json;version=3.0;compress=false',
    'Content-Type': 'application/json;charset=utf-8',
  },
  data: {},
});

/**
 * 请求拦截器，在发起请求之前
 */
http.interceptors.request.use(config => {
  const token = getToken();
  const utmSource = Cookie.get('utm_source');
  const utmMedium = Cookie.get('utm_medium');
  const utmCampaign = Cookie.get('utm_campaign');
  const utmTerm = Cookie.get('utm_term');
  const platform = (window as any).platform;

  const method = (config.method as string).toLocaleLowerCase();
  if (token) {
    config.headers['Atzuche-Token'] = token;
  }
  if (method === 'get') {
    if (typeof config.params !== 'object') {
      config.params = {};
    }

    // 兼容appserver的接口，appserver的接口token需要带在参数中，post请求也是一样
    if (token) {
      config.params.token = token;
    }
    if (utmSource) {
      config.params.utmSource = utmSource;
    }
    if (utmMedium) {
      config.params.utmMedium = utmMedium;
    }
    if (utmCampaign) {
      config.params.utmCampaign = utmCampaign;
    }
    if (utmTerm) {
      config.params.utmTerm = utmTerm;
    }

    config.params.requestId = Number(new Date());
    if (platform) {
      config.params.h5Platform = platform;
    }
  }

  const methods: string[] = ['post', 'put', 'patch', 'delete'];
  if (methods.indexOf(method) > -1 && typeof config.data !== 'string') {
    if (token) {
      config.data.token = token;
    }
    if (utmSource) {
      config.data.utmSource = utmSource;
    }
    if (utmMedium) {
      config.data.utmMedium = utmMedium;
    }
    if (utmCampaign) {
      config.data.utmCampaign = utmCampaign;
    }
    if (utmTerm) {
      config.data.utmTerm = utmTerm;
    }
    config.data.requestId = Number(new Date());
    if (platform) {
      config.data.h5Platform = platform;
    }
  }

  (config as any).____t = new Date().valueOf();

  return config;
});

/**
 * 接口响应拦截器，在接口响应之后
 */
http.interceptors.response.use(
  config => {
    // config data
    const cc = (config.config as any) || {};

    // report
    report(cc.____t && cc.url && cc.method, 'api/m', {
      m: cc.method,
      u: cc.url,
      p: window.location.origin + window.location.pathname,
      s: (new Date().valueOf() - cc.____t) / 1000,
      uu: uuid,
    });

    let strictModel = true; // 严格模式
    const data = config.data || {};

    // 目前的判断方式：因为resCode与resMsg是java端必给的字段，所以认为没有该两个字段时，走标准的http status模式
    if (typeof data.resCode !== 'undefined' && typeof data.resMsg !== 'undefined') {
      strictModel = false;
    }

    if (strictModel) {
      if (config.status >= 200 && config.status < 300) {
        return data;
      }

      if (config.status === 401) {
        clearToken();
        toLogin();
        return false;
      }

      // report error
      report(cc.url && cc.method, 'api_error/m', {
        m: cc.method,
        u: cc.url,
        p: window.location.origin + window.location.pathname,
        uu: uuid,
        s: config.status,
        err: JSON.stringify(data),
      });

      return Promise.reject(new HttpError(data.message || '', data));
    }

    // atcz java端的模式

    // 响应正常
    if (data.resCode === '000000') {
      return data.data;
    }

    if (data.resCode === '200008') {
      // 需要登录（没登录或登录过期）
      clearToken();
      toLogin();
      return false;
    }

    if (data.resCode === '200101') {
      // 需要绑定
      toLogin({ isBind: true });
      return false;
    }

    // report error
    report(cc.url && cc.method && data.resCode === '999999', 'api_error/m', {
      m: cc.method,
      u: cc.url,
      p: window.location.origin + window.location.pathname,
      uu: uuid,
      s: config.status,
      err: data.resMsg || data.msg || data.message,
    });

    // reject错误处理
    return Promise.reject(new HttpError(data.resMsg || data.msg || data.message, data));
  },
  error => {
    console.error('http:reject', error);

    if (error.response.status === 401) {
      clearToken();
      toLogin();
      return false;
    }

    const cc = error.config;
    const res = error.response || {};
    report(cc && res.status, 'api_error/m', {
      m: cc.method,
      u: cc.url,
      p: window.location.origin + window.location.pathname,
      uu: uuid,
      s: res.status,
      err: JSON.stringify(res.data),
    });

    // reject错误处理
    return Promise.reject(new HttpError(res.data && (res.data.message || '系统错误')));
  },
);

const httpCacheAdapter = (page: string, key: string, hour = 0) => {
  const adapter: AxiosAdapter = (conf: any) => {
    // 判断是否存在缓存数据
    const fullKey = `_auto_cache_${page}_${key}_`;
    let cache: string | null | undefined = void 0;
    let cacheJson: Record<string, any> = {};
    if (hour <= 0) {
      if (!(window as any)._auto_cache_) {
        (window as any)._auto_cache_ = {};
      } else {
        cache = (window as any)._auto_cache_[fullKey] ? '_' : void 0;
        cacheJson = (window as any)._auto_cache_[fullKey] || {};
      }
    } else {
      cache = localStorage.getItem(fullKey);
      cacheJson = cache ? JSON.parse(cache) : {};
      if (cacheJson.created && cacheJson.duration) {
        const horOffset = (new Date().valueOf() - cacheJson.created) / 1000 / 60 / 60;
        if (horOffset > cacheJson.duration) {
          localStorage.removeItem(fullKey);
          cache = null;
          cacheJson = {};
        }
      } else {
        cache = null;
      }
    }

    // 调用默认请求接口, 发送正常请求及返回
    if (!cache) {
      const newConf = { ...conf };
      delete newConf.adapter;
      return new Promise((resolve, reject) => {
        axios(newConf)
          .then(json => {
            const data = json.data || {};
            if (
              json.status === 200 &&
              data.resCode &&
              data.resMsg &&
              data.data &&
              data.resCode === '000000'
            ) {
              if (hour <= 0) {
                if (!(window as any)._auto_cache_) {
                  (window as any)._auto_cache_ = {};
                }
                (window as any)._auto_cache_[fullKey] = {
                  created: new Date().valueOf(),
                  response: data,
                  status: json.status,
                };
              } else {
                localStorage.setItem(
                  fullKey,
                  JSON.stringify({
                    created: new Date().valueOf(),
                    duration: hour,
                    response: data,
                    status: json.status,
                  }),
                );
              }
            }
            resolve(json);
          })
          .catch(err => reject(err));
      });
    }

    // 返回缓存数据
    return new Promise(resolve => {
      resolve({ data: cacheJson.response, status: cacheJson.status } as any);
    });
  };
  return adapter;
};

export { httpCacheAdapter };
