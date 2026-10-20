# 素材・生成記録

写真、紙、透過シルエットは内蔵image_genによる生成素材です。第三者参考サイトの写真やイラストは使っていません。

- `reference-fv.jpg`: 会話で作成した「VAIZO_FV_参考5サイト統合_v01.png」を配信用にJPEG変換。PCの写真はこの画像を透過シルエットでマスクし、元の写真と配置を保持しています。ヘッドライン、ナビゲーション、CTA、説明カードはHTMLで重ねています。
- `hero-cutouts.png`: 上記FV画像を参照して、中央の紙・文字・ボタン・説明カードを除き、3つの写真の窓を透過画像として生成。PCではアルファ形状を使用。小さな画面では各領域を切り分けて配置しています。
- `paper.jpg`: 本プロトタイプ用に生成した紙の表面テクスチャをJPEG変換。動作時は平らな内側をサンプリングし、Canvas 2Dで曲面に変形します。

写真はイメージです。実在するVAIZOのメンバー、顧客、商品、成果を示しません。公開リポジトリに正式ロゴの入稿データや社内資料は含みません。

透過素材の生成プロンプト：

```text
Precise compositing asset extraction/edit for implementing the ATTACHED APPROVED VAIZO website hero as native HTML. The reference is the exact edit target. Preserve the original photography, exact photographic people, original photographic scale and placement, and the original beautiful irregular large torn-paper openings. Output a high-resolution transparent-background PNG, same landscape canvas aspect ratio as the reference, approximately 1586x992. The result must contain ONLY the THREE photographic regions from the reference, in exactly their reference positions: 1) upper right photograph of black-shirt Japanese man making a prototype at a workbench, original torso and desk visible rather than just enormous head, roughly x46% to100%, y0% to42%; 2) lower right Japanese woman and man discussing a physical prototype, x70% to100%, y35% to77%; 3) lower left hands sketching on white paper at laptop, x0% to38%, y54% to91%. Keep their actual irregular inward-slanting tears and little paper-fiber edges, NOT rounded rectangle or straight rectangle frames. The upper-right cutout lower edge slopes diagonally down from the man toward the right. Photo regions should reach the canvas outer edges where reference does. Remove the ENTIRE opaque warm-white paper / central headline region and replace it with actual transparent alpha. This transparency is the negative-space sheet silhouette separating the three photographic windows. All text must be removed: NO VAIZO wordmark, NO navigation text or red contact button, NO huge AI or Japanese headline letters, NO supporting copy, NO CTA, NO scroll text, NO OUR BUSINESS. Also remove the AI workflow white card in upper-right photograph and realistically reconstruct the background studio photograph behind it. Remove the blue building strip at the very bottom, make its area transparent. No checkerboard, solid opaque background or fake alpha, no added typography, no new framing, no shadows on transparent areas. Critically preserve exact editorial photographic placement and broad paper-tear contours from the attached image so that native HTML typography can be overlaid in the original blank central space. This is one PHOTO COLLAGE WITH TRANSPARENT NEGATIVE SPACE, not a new redesign.
```
