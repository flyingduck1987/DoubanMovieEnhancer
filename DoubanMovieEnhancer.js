// ==UserScript==
// @name         豆瓣电影IMDb链接及评分
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  将豆瓣电影详情页中的IMDb编号转换为可点击的IMDb链接
// @author       Guy_Bass
// @match        https://movie.douban.com/subject/*
// @icon         https://www.google.com/s2/favicons?domain=douban.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 等待页面加载完成
    window.addEventListener('load', function() {
        // 查找包含IMDb编号的元素
        // 豆瓣页面中IMDb编号通常在<span class="pl">IMDb:</span>后面的<a>标签或直接文本中
        const findAndConvertIMDb = () => {
            // 方法1: 查找所有包含"IMDb:"的标签
            const plElements = document.querySelectorAll('.pl');
            for (const pl of plElements) {
                if (pl.textContent.includes('IMDb:')) {
                    // 获取下一个兄弟节点或父节点后的内容
                    let nextNode = pl.nextSibling;
                    let imdbId = null;

                    // 如果下一个节点是文本节点
                    if (nextNode && nextNode.nodeType === Node.TEXT_NODE && nextNode.textContent.trim()) {
                        imdbId = nextNode.textContent.trim();
                        // 移除原文本节点
                        if (imdbId && /^tt\d+$/.test(imdbId)) {
                            const link = document.createElement('a');
                            link.href = `https://www.imdb.com/title/${imdbId}/`;
                            link.textContent = imdbId;
                            link.target = '_blank';
                            link.style.color = '#0077cc';
                            link.style.textDecoration = 'none';
                            link.addEventListener('mouseenter', () => link.style.textDecoration = 'underline');
                            link.addEventListener('mouseleave', () => link.style.textDecoration = 'none');
                            nextNode.parentNode.replaceChild(link, nextNode);
                        }
                    }
                    // 如果下一个节点是<a>标签且包含tt数字
                    else if (nextNode && nextNode.nodeType === Node.ELEMENT_NODE && nextNode.tagName === 'A' && /^tt\d+$/.test(nextNode.textContent.trim())) {
                        imdbId = nextNode.textContent.trim();
                        if (imdbId) {
                            nextNode.href = `https://www.imdb.com/title/${imdbId}/`;
                            nextNode.target = '_blank';
                            nextNode.style.color = '#0077cc';
                        }
                    }
                    break;
                }
            }

            // 方法2: 对于新版豆瓣页面，IMDb信息可能在#info区域内
            const infoDiv = document.getElementById('info');
            if (infoDiv) {
                const text = infoDiv.innerHTML;
                // 使用正则匹配IMDb:后面的tt数字
                const imdbRegex = /IMDb:\s*<a\s+href="[^"]*">(tt\d+)<\/a>|<a\s+href="[^"]*">(tt\d+)<\/a>|IMDb:\s*(tt\d+)/;
                const match = text.match(imdbRegex);
                let imdbId = null;
                if (match) {
                    imdbId = match[1] || match[2] || match[3];
                    if (imdbId && !text.includes(`href="https://www.imdb.com/title/${imdbId}/`)) {
                        // 替换链接
                        const newHtml = text.replace(
                            new RegExp(`(IMDb:\\s*<a\\s+href=")[^"]*(">${imdbId}</a>)`),
                            `$1https://www.imdb.com/title/${imdbId}/$2`
                        ).replace(
                            new RegExp(`(<a\\s+href=")[^"]*(">${imdbId}</a>)(?=.*IMDb)`),
                            `$1https://www.imdb.com/title/${imdbId}/$2`
                        ).replace(
                            new RegExp(`(IMDb:\\s*)(${imdbId})(?!</a>)`),
                            `$1<a href="https://www.imdb.com/title/${imdbId}/" target="_blank" style="color:#0077cc">$2</a>`
                        );
                        if (newHtml !== text) {
                            infoDiv.innerHTML = newHtml;
                        }
                    }
                }
            }
        };

        // 调用转换函数
        findAndConvertIMDb();

        // 使用MutationObserver监听DOM变化，以防动态加载的内容
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.target.id === 'info') {
                    findAndConvertIMDb();
                }
            });
        });

        // 观察#info区域的变化
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            observer.observe(infoDiv, { childList: true, subtree: true, characterData: true });
        }
    });
})();
