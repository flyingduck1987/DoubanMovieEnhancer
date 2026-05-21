// ==UserScript==
// @name         豆瓣电影IMDb增强
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  显示豆瓣电影页面IMDb评分、家长指引内容，支持链接跳转
// @author       Guy_Bass
// @match        https://movie.douban.com/subject/*
// @grant        GM_xmlhttpRequest
// @connect      www.imdb.com
// @connect      www.omdbapi.com
// ==/UserScript==

(function() {
    'use strict';

    function run() {
        const info = document.getElementById('info');
        if (!info) return;

        const imdbMatch = info.textContent.match(/tt\d{7,8}/);
        if (!imdbMatch) return;
        const imdbId = imdbMatch[0];
        const imdbUrl = `https://www.imdb.com/title/${imdbId}/`;
        const pgUrl = `${imdbUrl}parentalguide`;

        // 替换为可点击链接
        info.innerHTML = info.innerHTML.replace(/tt\d{7,8}/g,
            `<a href="${imdbUrl}" target="_blank" style="color:#0066cc">${imdbId}</a>`
        );

        // 优先尝试OMDb API（更稳定），失败则使用IMDb直接请求
        getRatingFromOMDb(imdbId);
        getParentsGuide(pgUrl);
    }

    // 使用OMDb API获取评分（免费，更稳定）
    function getRatingFromOMDb(imdbId) {
        // 注意：OMDb API需要免费注册获取apikey，这里使用一个示例key
        // 你可以到 https://www.omdbapi.com/apikey.aspx 免费注册获取
        const apiKey = 'YOUR_API_KEY'; // 请替换为你的API key
        
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`,
            onload: function(res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.imdbRating && data.imdbRating !== 'N/A') {
                        insertRating(data.imdbRating + '/10', data.imdbVotes);
                    } else {
                        // 如果OMDb失败，尝试直接请求IMDb
                        getRatingFromIMDb(imdbId);
                    }
                } catch(e) {
                    getRatingFromIMDb(imdbId);
                }
            },
            onerror: function() {
                getRatingFromIMDb(imdbId);
            }
        });
    }

    // 直接从IMDb获取评分（备用方案）
    function getRatingFromIMDb(imdbId) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.imdb.com/title/${imdbId}/`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            onload: function(res) {
                let score = "无评分";
                try {
                    // 尝试从JSON-LD数据中提取评分
                    const jsonMatch = res.responseText.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
                    if (jsonMatch) {
                        const jsonData = JSON.parse(jsonMatch[1]);
                        if (jsonData.aggregateRating && jsonData.aggregateRating.ratingValue) {
                            score = jsonData.aggregateRating.ratingValue + '/10';
                        }
                    }
                    
                    // 备用方案：使用DOM解析
                    if (score === "无评分") {
                        const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                        // 尝试多个可能的选择器
                        const selectors = [
                            '[data-testid="hero-rating-bar__aggregate-rating__score"]',
                            '.sc-d541859f-1.imUuxf',
                            '.sc-bde20123-1.cMEQkK'
                        ];
                        
                        for (const selector of selectors) {
                            const element = doc.querySelector(selector);
                            if (element) {
                                const text = element.textContent.trim();
                                if (text && text.match(/\d/)) {
                                    score = text;
                                    break;
                                }
                            }
                        }
                    }
                } catch(e) {
                    console.error('解析IMDb评分失败:', e);
                }
                insertRating(score);
            },
            onerror: function() {
                insertRating("获取失败");
            }
        });
    }

    function insertRating(score, votes) {
        const div = document.createElement("div");
        div.style.marginTop = "4px";
        let html = `<span class="pl">IMDb 评分：</span> <strong style="color:#e67e22">${score}</strong>`;
        if (votes) {
            html += ` <span style="color:#999">(${parseInt(votes).toLocaleString()} 票)</span>`;
        }
        div.innerHTML = html;
        document.getElementById('info').appendChild(div);
    }

    // 抓取家长指引
    function getParentsGuide(url) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            onload: function(res) {
                let html = "";
                try {
                    const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                    
                    // 尝试新的选择器
                    let blocks = doc.querySelectorAll('[data-testid="parental-advisory-section"]');
                    if (blocks.length === 0) {
                        blocks = doc.querySelectorAll('section.ipc-page-section');
                    }
                    
                    blocks.forEach(function(blk) {
                        const h = blk.querySelector('h3, h4, .ipc-title__text');
                        const c = blk.querySelector('.ipc-html-content-inner-div, [data-testid="advisory-severity"]');
                        
                        if (!h || !c) return;
                        
                        const title = h.textContent.trim();
                        let text = c.textContent.trim().replace(/\s+/g, " ");
                        
                        if (!text || text.length < 3) return;
                        
                        // 限制文本长度
                        if (text.length > 500) {
                            text = text.substring(0, 500) + '...';
                        }
                        
                        html += `<div style="margin:8px 0;"><strong style="color:#111;font-size:14px">${title}</strong><br><span style="font-size:13px">${text}</span></div>`;
                    });
                    
                    // 如果还是没有内容，尝试从整个页面提取文本
                    if (!html) {
                        const allText = doc.body.textContent;
                        const keywords = ['Sex & Nudity', 'Violence & Gore', 'Profanity', 'Alcohol', 'Frightening'];
                        let foundContent = false;
                        
                        keywords.forEach(function(keyword) {
                            const regex = new RegExp(`${keyword}[\\s\\S]{0,300}?(?=${keywords.join('|')}|$)`, 'i');
                            const match = allText.match(regex);
                            if (match) {
                                let content = match[0].replace(/\s+/g, ' ').trim();
                                if (content.length > 500) {
                                    content = content.substring(0, 500) + '...';
                                }
                                html += `<div style="margin:8px 0;"><strong style="color:#111;font-size:14px">${keyword}</strong><br><span style="font-size:13px">${content}</span></div>`;
                                foundContent = true;
                            }
                        });
                        
                        if (!foundContent) {
                            html = "暂无内容或解析失败";
                        }
                    }
                } catch(e) {
                    console.error('解析家长指引失败:', e);
                    html = "解析失败";
                }
                insertPG(html || "暂无内容", url);
            },
            onerror: function() {
                insertPG("请求失败", url);
            }
        });
    }

    function insertPG(content, url) {
        // 检查是否已存在，避免重复插入
        if (document.getElementById('imdb-parental-guide')) return;
        
        const box = document.createElement("div");
        box.id = 'imdb-parental-guide';
        box.style.margin = "12px 0";
        box.style.padding = "12px 16px";
        box.style.background = "#f8f8f8";
        box.style.borderRadius = "5px";
        box.style.lineHeight = "1.7";
        box.style.maxWidth = "980px";
        box.style.fontSize = "14px";

        box.innerHTML = `
            <div style="font-weight:bold;margin-bottom:12px;font-size:15px;color:#333">
                IMDb 家长指引
                <a href="${url}" target="_blank" style="font-weight:normal;font-size:13px;color:#0066cc;margin-left:8px">查看完整页面 →</a>
            </div>
            <div style="max-height:600px;overflow-y:auto;">
                ${content}
            </div>
        `;
        
        // 插入到info区域之后
        const info = document.getElementById('info');
        if (info && info.parentNode) {
            info.parentNode.insertBefore(box, info.nextSibling);
        }
    }

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(run, 1000);
        });
    } else {
        setTimeout(run, 1000);
    }
})();
