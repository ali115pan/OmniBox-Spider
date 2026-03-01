/**
 * ============================================================================
 * 123TV资源 - OmniBox 爬虫脚本 (T3→T4转换版)
 * ============================================================================
 */
const axios = require("axios");
const https = require("https");
const OmniBox = require("omnibox_sdk");

// ========== 全局配置 ==========
const host = 'https://a123tv.com';
const def_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': '*/*'
};

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 15000
});

/**
 * 日志工具函数
 */
const logInfo = (message, data = null) => {
    const output = data ? `${message}: ${JSON.stringify(data)}` : message;
    OmniBox.log("info", `[123TV-DEBUG] ${output}`);
};

const logError = (message, error) => {
    OmniBox.log("error", `[123TV-DEBUG] ${message}: ${error.message || error}`);
};

/**
 * 图像地址修复
 */
const fixPicUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('//') ? `https:${url}` : `https://${url}`;
};

/**
 * 核心:解析 CMS 字符串为结构化播放源 [1]
 * T3格式转T4格式的关键函数
 */
const parsePlaySources = (fromStr, urlStr) => {
    logInfo("开始解析播放源字符串", { from: fromStr, url: urlStr });
    const playSources = [];
    if (!fromStr || !urlStr) return playSources;

    const froms = fromStr.split('$$$');
    const urls = urlStr.split('$$$');

    for (let i = 0; i < froms.length; i++) {
        const sourceName = froms[i] || `线路${i + 1}`;
        const sourceItems = urls[i] ? urls[i].split('#') : [];

        const episodes = sourceItems.map(item => {
            const parts = item.split('$');
            return {
                name: parts[0] || '正片',
                playId: parts[1] || parts[0]
            };
        }).filter(e => e.playId);

        if (episodes.length > 0) {
            playSources.push({
                name: sourceName,
                episodes: episodes
            });
        }
    }
    logInfo("播放源解析结果", playSources);
    return playSources;
};

/**
 * 首页接口 [2]
 */
async function home(params) {
    logInfo("进入首页");
    return {
        class: [
            { 'type_id': '10', 'type_name': '电影' },
            { 'type_id': '11', 'type_name': '连续剧' },
            { 'type_id': '12', 'type_name': '综艺' },
            { 'type_id': '13', 'type_name': '动漫' },
            // { 'type_id': '15', 'type_name': '福利' }
        ],
        filters: {
            '10': [{"key": "class", "name": "类型", "value": [
                {"name": "全部", "value": ""}, {"name": "动作片", "value": "1001"}, {"name": "喜剧片", "value": "1002"},
                {"name": "爱情片", "value": "1003"}, {"name": "科幻片", "value": "1004"}, {"name": "恐怖片", "value": "1005"},
                {"name": "剧情片", "value": "1006"}, {"name": "战争片", "value": "1007"}, {"name": "纪录片", "value": "1008"},
                {"name": "动漫电影", "value": "1010"}, {"name": "奇幻片", "value": "1011"}, {"name": "动画片", "value": "1013"},
                {"name": "犯罪片", "value": "1014"}, {"name": "悬疑片", "value": "1016"}, {"name": "邵氏电影", "value": "1019"},
                {"name": "歌舞片", "value": "1022"}, {"name": "家庭片", "value": "1024"}, {"name": "古装片", "value": "1025"},
                {"name": "历史片", "value": "1026"}, {"name": "4K电影", "value": "1027"}
            ]}],
            '11': [{"key": "class", "name": "地区", "value": [
                {"name": "全部", "value": ""}, {"name": "国产剧", "value": "1101"}, {"name": "香港剧", "value": "1102"},
                {"name": "台湾剧", "value": "1105"}, {"name": "韩国剧", "value": "1103"}, {"name": "欧美剧", "value": "1104"},
                {"name": "日本剧", "value": "1106"}, {"name": "泰国剧", "value": "1108"}, {"name": "港台剧", "value": "1110"},
                {"name": "日韩剧", "value": "1111"}, {"name": "海外剧", "value": "1107"}
            ]}],
            '12': [{"key": "class", "name": "类型", "value": [
                {"name": "全部", "value": ""}, {"name": "内地综艺", "value": "1201"}, {"name": "港台综艺", "value": "1202"},
                {"name": "日韩综艺", "value": "1203"}, {"name": "欧美综艺", "value": "1204"}, {"name": "国外综艺", "value": "1205"}
            ]}],
            '13': [{"key": "class", "name": "类型", "value": [
                {"name": "全部", "value": ""}, {"name": "国产动漫", "value": "1301"}, {"name": "日韩动漫", "value": "1302"},
                {"name": "欧美动漫", "value": "1303"}, {"name": "海外动漫", "value": "1305"}, {"name": "里番", "value": "1307"}
            ]}],
            '15': [{"key": "class", "name": "分类", "value": [
                {"name": "全部", "value": ""}, {"name": "韩国情色片", "value": "1551"}, {"name": "日本情色片", "value": "1552"},
                {"name": "大陆情色片", "value": "1555"}, {"name": "香港情色片", "value": "1553"}, {"name": "台湾情色片", "value": "1554"},
                {"name": "美国情色片", "value": "1556"}, {"name": "欧洲情色片", "value": "1557"}, {"name": "印度情色片", "value": "1558"},
                {"name": "东南亚情色片", "value": "1559"}, {"name": "其它情色片", "value": "1550"}
            ]}]
        },
        list: []
    };
}

/**
 * 分类接口 [2]
 */
async function category(params) {
    const { categoryId, page, filters } = params;
    const pg = parseInt(page) || 1;
    
    // 处理筛选参数
    let tid = categoryId;
    if (filters && filters.class) {
        tid = filters.class;
    }
    
    const url = pg === 1 
        ? `${host}/t/${tid}.html` 
        : `${host}/t/${tid}/p${pg}.html`;
    
    logInfo(`请求分类: ${tid}, 页码: ${pg}, URL: ${url}`);
    
    try {
        const res = await axiosInstance.get(url, { headers: def_headers });
        const html = res.data;
        
        // 解析视频列表
        const regex = /<a class="w4-item" href="([^"]+)".*?<img.*?data-src="([^"]+)".*?<div class="s">.*?<span>([^<]+)<\/span>.*?<div class="t"[^>]*title="([^"]+)">.*?<div class="i">([^<]+)<\/div>/gs;
        const videos = [];
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            videos.push({
                vod_id: match[1],
                vod_name: match[4].trim(),
                vod_pic: fixPicUrl(match[2]),
                vod_remarks: match[3].trim()
            });
        }
        
        // 解析总页数
        const pageRegex = /\/p(\d+)\.html"[^>]*>(\d+)<\/a>/g;
        let maxPage = pg;
        let pageMatch;
        while ((pageMatch = pageRegex.exec(html)) !== null) {
            maxPage = Math.max(maxPage, parseInt(pageMatch[2]));
        }
        
        logInfo(`分类结果: ${videos.length}条, 总页数: ${maxPage}`);
        
        return {
            list: videos,
            page: pg,
            pagecount: maxPage
        };
    } catch (e) {
        logError("分类请求失败", e);
        return { list: [], page: pg, pagecount: 0 };
    }
}

/**
 * 搜索接口 [2]
 */
async function search(params) {
    const wd = params.keyword || params.wd || "";
    const pg = parseInt(params.page) || 1;
    
    const encodedKw = encodeURIComponent(wd);
    const url = pg === 1 
        ? `${host}/s/${encodedKw}.html` 
        : `${host}/s/${encodedKw}/p${pg}.html`;
    
    logInfo(`搜索关键词: ${wd}, 页码: ${pg}, URL: ${url}`);
    
    try {
        const res = await axiosInstance.get(url, { headers: def_headers });
        const html = res.data;
        
        // 解析搜索结果
        const regex = /<a class="w4-item" href="([^"]+)".*?<img.*?data-src="([^"]+)".*?<div class="t"[^>]*>([^<]+)<\/div>.*?<div class="i">([^<]+)<\/div>/gs;
        const videos = [];
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            videos.push({
                vod_id: match[1],
                vod_name: match[3].trim(),
                vod_pic: fixPicUrl(match[2]),
                vod_remarks: match[4].trim()
            });
        }
        
        logInfo(`搜索结果: ${videos.length}条`);
        
        return {
            list: videos,
            page: pg,
            pagecount: 10
        };
    } catch (e) {
        logError("搜索失败", e);
        return { list: [], page: pg, pagecount: 0 };
    }
}

/**
 * 详情接口 [1][2]
 * 关键：将T3的vod_play_from/vod_play_url转换为T4的vod_play_sources
 */
async function detail(params) {
    const videoId = params.videoId;
    const url = videoId.startsWith('http') ? videoId : `${host}${videoId}`;
    
    logInfo(`请求详情: ${videoId}, URL: ${url}`);
    
    try {
        const res = await axiosInstance.get(url, { headers: def_headers });
        const html = res.data;
        
        const vod = {
            vod_id: videoId,
            vod_name: '',
            vod_pic: '',
            vod_type: '',
            vod_year: '',
            vod_area: '',
            vod_remarks: '',
            vod_actor: '',
            vod_director: '',
            vod_content: ''
        };
        
        // 解析标题
        const titleMatch = html.match(/<li class="on"><h1>([^<]+)<\/h1><\/li>/);
        if (titleMatch) vod.vod_name = titleMatch[1];
        
        // 解析封面
        const picMatch = html.match(/data-poster="([^"]+)"/);
        if (picMatch) vod.vod_pic = fixPicUrl(picMatch[1]);
        
        // 解析描述和演员信息
        const descMatch = html.match(/name="description" content="(.*?)"/);
        if (descMatch) {
            const content = descMatch[1];
            vod.vod_content = content;
            
            const actorMatch = content.match(/演员:(.*?)(。|$)/);
            if (actorMatch) vod.vod_actor = actorMatch[1];
            
            const areaMatch = content.match(/地区:(.*?)(。|$)/);
            if (areaMatch) vod.vod_area = areaMatch[1];
            
            const directorMatch = content.match(/导演:(.*?)(。|$)/);
            if (directorMatch) vod.vod_director = directorMatch[1];
        }
        
        // 解析播放源数据 [2]
        const scriptMatch = html.match(/var pp=({.*?});/s);
        if (scriptMatch) {
            try {
                const ppData = JSON.parse(scriptMatch[1]);
                const vno = ppData.no;
                const playFromArr = [];
                const playUrlArr = [];
                
                for (const line of ppData.la || []) {
                    const [lineId, lineName, episodeCount] = line;
                    const episodes = [];
                    
                    for (let i = 0; i < episodeCount; i++) {
                        episodes.push(`第${i + 1}集$/v/${vno}/${lineId}z${i}.html`);
                    }
                    
                    if (episodes.length > 0) {
                        playFromArr.push(lineName);
                        playUrlArr.push(episodes.join('#'));
                    }
                }
                
                // T3格式数据
                const vodPlayFrom = playFromArr.join('$$$');
                const vodPlayUrl = playUrlArr.join('$$$');
                
                // 转换为T4格式 [1]
                vod.vod_play_sources = parsePlaySources(vodPlayFrom, vodPlayUrl);
                
                logInfo("播放源解析完成", { 
                    fromCount: playFromArr.length, 
                    sources: vod.vod_play_sources.length 
                });
            } catch (e) {
                logError("解析播放源数据失败", e);
            }
        }
        
        return { list: [vod] };
    } catch (e) {
        logError("详情获取失败", e);
        return { list: [] };
    }
}

/**
 * 播放接口 [2]
 */
async function play(params) {
    const playId = params.playId;
    const url = `${host}${playId}`;
    
    logInfo(`准备播放: ${playId}, URL: ${url}`);
    
    try {
        const res = await axiosInstance.get(url, { headers: def_headers });
        const html = res.data;
        
        // 解析真实播放地址
        const match = html.match(/data-src="([^"]+)"/);
        if (match) {
            const playUrl = match[1];
            logInfo(`解析到播放地址: ${playUrl}`);
            
            return {
                urls: [{ name: "默认", url: playUrl }],
                parse: 0,
                header: def_headers
            };
        }
    } catch (e) {
        logError("解析播放地址失败", e);
    }
    
    return {
        urls: [{ name: "默认", url: "" }],
        parse: 0,
        header: def_headers
    };
}

module.exports = { home, category, search, detail, play };

const runner = require("spider_runner");
runner.run(module.exports);
