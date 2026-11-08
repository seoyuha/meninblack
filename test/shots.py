import asyncio, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1]; OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        def watch(pg, tag):
            pg.on('pageerror', lambda e: errs.append(f'{tag}: {e}'))
            pg.on('console', lambda m: errs.append(f'{tag} console: {m.text}') if m.type == 'error' and 'fonts' not in m.text else None)
        T = await b.new_page(viewport={'width': 1280, 'height': 900}); watch(T, 'T')
        await T.goto(URL + '/teacher.html'); await T.fill('#pw', 'finel9932!'); await T.click('#pwGo'); await T.wait_for_timeout(700)
        await T.click('#uAll'); await T.click('#oMode label:nth-child(1)'); await T.click('#saveSet'); await T.wait_for_timeout(300)
        S1 = await b.new_page(viewport={'width': 1180, 'height': 820}); watch(S1, 'S1')
        S2 = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2); watch(S2, 'S2')
        await S1.goto(URL); await S1.screenshot(path=f'{OUT}/01_join.png')
        await S2.goto(URL); await S2.screenshot(path=f'{OUT}/01_join_phone.png', full_page=True)
        for pg, nm in ((S1, '김지우'), (S2, '박서준')):
            await pg.fill('#jCode', '0608'); await pg.fill('#jName', nm); await pg.click('#jGo'); await pg.wait_for_timeout(400)
        await S1.screenshot(path=f'{OUT}/02_wait.png')
        await T.click('#bStart'); await T.wait_for_timeout(800)
        await S1.screenshot(path=f'{OUT}/03_brief.png', full_page=True)
        await S2.screenshot(path=f'{OUT}/03_brief_phone.png', full_page=True)
        await T.screenshot(path=f'{OUT}/10_teacher.png', full_page=True)
        for pg in (S1, S2): await pg.click('text=준비 완료! 출동')
        await S1.wait_for_timeout(800)
        await S1.click('text=단서 전달'); await S1.wait_for_timeout(600)
        await S2.screenshot(path=f'{OUT}/04_inv_phone_pending.png', full_page=True)
        # 해독
        for pg in (S1, S2):
            v = await pg.evaluate('V')
            for c in v['clues']:
                if c['status'] == 'pending':
                    right = [o for o in c['opts'] if c['text'].replace('_____', o) == c['full']]
                    if right: await pg.click(f".opts[data-i='{c['i']}'] button:text-is(\"{right[0]}\")")
        await S2.click('text=단서 전달'); await S2.wait_for_timeout(400)
        v = await S1.evaluate('V')
        for c in v['clues']:
            if c['status'] == 'pending':
                right = [o for o in c['opts'] if c['text'].replace('_____', o) == c['full']]
                if right: await S1.click(f".opts[data-i='{c['i']}'] button:text-is(\"{right[0]}\")")
        await S1.wait_for_timeout(12000)  # 봇 단서 전송·해독
        await S1.screenshot(path=f'{OUT}/05_inv.png', full_page=True)
        await S1.click('.cand >> nth=0'); await S1.wait_for_timeout(300)
        await S1.click('text=영어로 질문하기'); await S1.wait_for_timeout(200)
        await S1.click('.qlist button >> nth=0'); await S1.wait_for_timeout(500)
        await S1.screenshot(path=f'{OUT}/06_dossier.png')
        await S1.click('#mbox .x'); await S1.click('.tabs button[data-t=cmp]'); await S1.wait_for_timeout(300)
        await S1.screenshot(path=f'{OUT}/07_compare.png', full_page=True)
        await S2.click('.tabs button[data-t=cmp]'); await S2.wait_for_timeout(300)
        await S2.screenshot(path=f'{OUT}/07_compare_phone.png', full_page=True)
        # 지목: 일부러 틀린 후보 먼저
        alien = await S1.evaluate('null')
        await S1.click('#bAccuse'); await S1.wait_for_timeout(300)
        await S1.click('.pick .cand >> nth=0'); await S1.wait_for_timeout(200)
        await S1.screenshot(path=f'{OUT}/08_accuse.png')
        await S1.click('text=스캔 요청'); await S1.wait_for_timeout(600)
        await S2.screenshot(path=f'{OUT}/09_vote_phone.png')
        await S2.click('.votebar >> text=동의'); await S1.wait_for_timeout(1200)
        await S1.screenshot(path=f'{OUT}/11_scan.png')
        await S1.wait_for_timeout(4500)
        ph = (await S1.evaluate('V.phase'))
        tries = 0
        while ph == 'inv' and tries < 5:
            tries += 1
            await S1.click('#bAccuse'); await S1.wait_for_timeout(300)
            await S1.click('.pick .cand >> nth=0'); await S1.click('text=스캔 요청'); await S1.wait_for_timeout(500)
            if await S2.locator('.votebar >> text=동의').count(): await S2.click('.votebar >> text=동의')
            await S1.wait_for_timeout(2600)
            if tries == 1: await S1.screenshot(path=f'{OUT}/11b_scan2.png')
            await S1.wait_for_timeout(3000)
            ph = await S1.evaluate('V.phase')
        await S1.screenshot(path=f'{OUT}/12_reveal.png', full_page=True)
        await S2.screenshot(path=f'{OUT}/12_reveal_phone.png', full_page=True)
        await S1.click('text=사건 보고서 쓰기'); await S1.wait_for_timeout(600)
        for pg in (S1, S2):
            v = await pg.evaluate('V')
            m = [r for r in v['report'] if r['mine']]
            if m:
                await pg.fill('#rIn', 'wrong'); await pg.click('text=제출'); await pg.wait_for_timeout(300)
        await S1.screenshot(path=f'{OUT}/13_report.png', full_page=True)
        await T.screenshot(path=f'{OUT}/14_teacher_live.png', full_page=True)
        await T.click('#viewTabs button[data-v=book]'); await T.wait_for_timeout(800)
        await T.screenshot(path=f'{OUT}/15_book.png')
        print('\n'.join(errs[:20]) or 'no errors')
        await b.close()
asyncio.run(main())
