// ==UserScript==
// @name         豆瓣电影IMDb增强
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  显示豆瓣电影页面IMDb评分、家长指引内容，支持链接跳转
// @author       Guy_Bass
// @match        https://movie.douban.com/subject/*
// @grant        GM_xmlhttpRequest
// @connect      www.imdb.com
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

        getRating(imdbId);
        getParentsGuide(pgUrl);
    }

    // 获取IMDb评分
    function getRating(imdbId) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.imdb.com/title/${imdbId}/`,
            onload: res => {
                let score = "无评分";
                try {
                    const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                    const r1 = doc.querySelector(".ipc-rating-star--rating");
                    const r2 = doc.querySelector('[data-testid="hero-rating-bar__aggregate-rating__score"]');
                    if(r1) score = r1.textContent.trim();
                    else if(r2) score = r2.textContent.trim();
                }catch(e){}
                insertRating(score);
            },
            onerror: ()=>insertRating("获取失败")
        });
    }

    function insertRating(score){
        const div = document.createElement("div");
        div.style.marginTop = "4px";
        div.innerHTML = `<span class="pl">IMDb 评分：</span> <strong style="color:#e67e22">${score}</strong>`;
        document.getElementById('info').appendChild(div);
    }

    // 抓取家长指引，标题加粗+分行
    function getParentsGuide(url){
        GM_xmlhttpRequest({
            method:"GET",
            url:url,
            onload:res=>{
                let html = "";
                try{
                    const doc = new DOMParser().parseFromString(res.responseText,"text/html");
                    const blocks = doc.querySelectorAll("section.ipc-page-section");
                    blocks.forEach(blk=>{
                        const h = blk.querySelector("h3.ipc-title__text");
                        const c = blk.querySelector(".ipc-html-content-inner-div");
                        if(!h || !c) return;
                        const title = h.textContent.trim();
                        const text = c.textContent.trim().replace(/\s+/g," ");
                        if(!text) return;
                        html += `<div style="margin:8px 0;"><strong style="color:#111;font-size:14px">${title}</strong><br><span style="font-size:13px">${text}</span></div>`;
                    });
                }catch(e){
                    html = "解析失败";
                }
                insertPG(html || "暂无内容", url);
            },
            onerror:()=>insertPG("请求失败",url)
        });
    }

    function insertPG(content,url){
        const box = document.createElement("div");
        box.style.margin = "12px 0";
        box.style.padding = "12px 16px";
        box.style.background = "#f8f8f8";
        box.style.borderRadius = "5px";
        box.style.lineHeight = "1.7";
        box.style.maxWidth = "980px";

        box.innerHTML = `
            <div style="font-weight:bold;margin-bottom:8px">
                IMDb 家长指引
                <a href="${url}" target="_blank" style="font-weight:normal;font-size:12px;color:#0066cc;margin-left:8px">查看完整页面</a>
            </div>
            ${content}
        `;
        document.getElementById('info').after(box);
    }

    setTimeout(run, 800);
})();
