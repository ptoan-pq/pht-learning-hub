# PHT Learning Hub — website học cá nhân

Trang chủ `/` gom sáu lộ trình: [Học lái xe Virginia](/driving/), [PQ Buddhist English](https://ptoan-pq.github.io/pq-buddhist-english/) và [Cẩm nang điện ảnh](https://ptoan-pq.github.io/cam-nang-dien-anh/). Bộ học DMV cũ được giữ nguyên dưới `/driving/`, với các trang bài học, ôn thi, hiểu sâu và tiến độ.

**Website public:** https://ptoan-pq.github.io/pht-learning-hub/

Website tĩnh bằng tiếng Việt, dùng HTML/CSS/JavaScript và dữ liệu Virginia DMV. Có 16 URL bài học riêng, 78 mục lý thuyết có hình gốc, 51 thuật ngữ, 40 ghi chú dễ nhầm, 240 câu DMV đủ căn cứ đối chiếu để luyện và 64 bài tập gia sư biên soạn.

## Sử dụng

- **Bài học:** đọc bản tiếng Việt đầy đủ của các đoạn nguồn đang hiển thị, xem/phóng hình gốc, học thuật ngữ và ghi chú riêng. Phần ngắn cũ nằm trong **Ghi nhớ nhanh — bản tóm tắt**. Mỗi mục có nút **Xem nội dung tiếng Anh** để mở đoạn gốc DMV dưới dạng văn bản ngay tại chỗ; bấm **Thu gọn tiếng Anh** để đóng lại. Thuật ngữ và chỗ dễ nhầm cũng có phần tiếng Anh, được ghi rõ là bản dịch giải thích của gia sư. Đánh dấu từng mục đã đọc. Trước bài mới có gói ôn câu đã học nếu đã có kết quả cũ.
- **Ôn thi DMV:** chọn chủ đề, gói 5 hoặc 10 câu, ôn câu sai/đến hạn hoặc chọn ngẫu nhiên. Gói cuối của chủ đề có thể ít hơn 5 câu. Câu hỏi, lựa chọn và giải thích đáp án chỉ hiển thị tiếng Anh; giữ nguyên câu và thứ tự đáp án DMV. Có thể mở đoạn nguồn tiếng Anh để đọc đầy đủ ngữ cảnh.
- **Đề mô phỏng:** 10 câu nhóm biển báo phải đúng cả10 để mở30 câu kiến thức chung, cần đúng24. Hiển thị10 câu mỗi trang. Không giới hạn thời gian; câu luyện công khai không phải đề thi thực tế.
- **Hiểu sâu:** tình huống, chọn nhiều đáp án và tự luận bằng tiếng Anh. Giải thích và tiêu chí tự đối chiếu cũng bằng tiếng Anh; bài viết không được tự động chấm ý nghĩa. Kết quả tách riêng với câu DMV. Dữ liệu tiếng Anh ở `content/deep-english-a.json` và `content/deep-english-b.json` giữ nguyên ID, thứ tự lựa chọn và khóa chấm.
- **Tiến độ:** tự lưu trong localStorage của trình duyệt. Xuất/nhập JSON để sao lưu và chuyển thiết bị; có thể nhập `progress.json` v2 của agent cũ. Khi nhập, giữ bản trước để khôi phục.

Để mang tiến độ agent cũ sang web: tải tệp tiến độ riêng được cung cấp trong cuộc trò chuyện → mở **Tiến độ** → chọn tệp → xem trước → **Áp dụng bản tiến độ này**. Tệp được xử lý trên máy, không tải lên máy chủ. Tiến độ trò chuyện và tiến độ web không tự đồng bộ hai chiều.

Ngay trong mỗi trang bài học, đầu bài có tối đa 5 câu ôn từ các bài trước đã học hoặc đã trả lời; ưu tiên câu sai, câu chưa làm rồi câu lâu chưa ôn. Cuối bài có bảng câu DMV để trả lời và chấm tại chỗ, mặc định 5 câu; sau khi chấm có thể chọn gói tiếp theo 5 hoặc 10 câu. Nếu ngân hàng của bài có ít hơn số câu đã chọn, hiển thị số thực có. Câu hỏi và đáp án luôn bằng tiếng Anh. Kết quả đã chấm có thể mở lại để xem lời giải.

Mỗi bài lưu riêng gói ôn đầu bài và gói kiểm tra cuối bài, kể cả lựa chọn dở dang. Các gói này cùng ghi kết quả vào lịch ôn, nhưng không ghi đè gói đang làm ở trang Ôn thi hoặc Hiểu sâu. Bản xuất JSON bao gồm các gói trong bài; bản lưu cũ vẫn nhập được.

Xóa dữ liệu trình duyệt, chuyển trình duyệt hoặc đổi địa chỉ website sẽ không mang bản lưu theo. Hãy xuất JSON sau các buổi học quan trọng. Website không chứa tiến độ cá nhân trong mã nguồn hay dữ liệu được triển khai.

## Chạy trên máy

Giải nén cả thư mục rồi chạy từ thư mục này:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Mở `http://127.0.0.1:4173`. Không mở trực tiếp `index.html` bằng đường dẫn `file://`, vì dữ liệu bài học được tải qua HTTP. Dừng máy chủ bằng Ctrl+C. Dữ liệu đã nằm trong bộ website; phông chữ Google có phông hệ thống dự phòng khi không có mạng.

## Nguồn và giới hạn

- [Virginia DMV Driver’s Manual](https://www.dmv.virginia.gov/licenses-ids/exams/manual).
- [PDF tháng4/2026](https://www.dmv.virginia.gov/sites/default/files/forms/dmv39.pdf).
- [Study Guide công khai](https://transactions.dmv.virginia.gov/dmv-manuals/).
- [Thể thức thi kiến thức](https://www.dmv.virginia.gov/licenses-ids/exams/know-exam).

Nguồn gốc tải15/09/2026; trang chính thức/tên bản PDF kiểm tra lại27/10/2026. 266 câu gốc được lưu nguyên văn trong dữ liệu; 26 câu chưa rõ hoặc mâu thuẫn được loại khỏi bộ chấm. Trang **Nguồn DMV** liệt kê từng mã và lý do. Mỗi bản dịch có trang nguồn, trích đoạn đối chiếu và giải thích; đối chiếu có thể vẫn có sai sót và không phải chứng nhận của DMV.

Một số chi tiết ngay trong PDF có dấu hiệu cũ hoặc không đồng nhất, đặc biệt bảo hiểm và mốc tuổi ở các phần thủ tục. Bài16 ghi chú vấn đề và không dạy các số tiền bảo hiểm cũ như quy định hiện hành. Website không tự cập nhật khi DMV sửa nguồn. Xem lại DMV trước khi dùng các thông tin thủ tục có thể thay đổi.

## Mã nguồn và kiểm tra

Không cần cài thư viện để dùng website hoặc chạy kiểm tra logic:

```sh
node build.mjs
node test.mjs
```

`content/source.json` giữ dữ liệu công khai để có thể dựng lại khi không có thư mục agent gốc bên cạnh. Các ảnh gốc nằm trong `dist/assets/`. Bản dịch/đối chiếu nằm ở `content/questions-a.json`, `content/questions-b.json`, `content/lessons-vi.json`; bài gia sư ở `content/deep.mjs`. `content/english-a.json`, `english-b.json`, `english-c.json` ánh xạ từng mục sang các đoạn tiếng Anh tương ứng. `build.mjs` kiểm tra mọi trích đoạn khớp văn bản DMV, đủ số mục/thuật ngữ/lưu ý, số lựa chọn và cấu trúc trước khi tạo `dist/data/course.json`.

`content/vietnamese-full-a.json`, `vietnamese-full-b.json`, `vietnamese-full-c.json` lưu bản dịch đầy đủ theo180khối nguồn của78mục. Bản tóm tắt cũ được giữ riêng, không dùng thay bản dịch. Quy ước thuật ngữ và lực câu nằm ở `content/TRANSLATION.md`. `content/translation-source-lock.json` khóa dấu kiểm tra của mỗi đoạn Anh; khi sửa nguồn Anh phải rà lại bản Việt tương ứng. Kiểm tra độ bao phủ và số liệu giúp phát hiện thiếu sót, không tự chứng minh một bản dịch chính xác. Vấn đề của nguồn được ghi riêng trong các tệp `content/translation-report-*.md`.

`qa-browser.cjs` là kịch bản kiểm thử giao diện tùy chọn, dùng Playwright đã cài và Chrome trên máy. `qa-lesson-quiz.cjs` kiểm tra hai gói ngay trong bài: vị trí, chấm, lưu dở, chuyển bài, tải lại, và giữ riêng gói ôn thi đang làm. Chạy sau khi mở máy chủ. Các kịch bản chỉ dùng hồ sơ giả trong trình duyệt kiểm thử riêng; không thay đổi tiến độ agent hoặc trình duyệt cá nhân.

Kiểm tra bao gồm lưu lựa chọn dở, chấm đúng một lần, nhập tiến độv2, giữ tách biệt bài hiểu sâu, ôn trước bài mới và cấu trúc đề mô phỏng. Giao diện đã được kiểm tra ở1440px và390px. Bản tĩnh không có AI trò chuyện trực tiếp hay đồng bộ đám mây.

## Học viết nhạc bằng tai

`/music/` chứa trang học nhạc đã có: 40 nguyên tắc, 8 bản âm thanh nhúng và nút nghe so sánh. Có liên kết từ trang chủ, thanh điều hướng và đường quay về Learning Hub. Trang độc lập nằm trong `dist/music/index.html`, giữ nguyên âm thanh và cách học, không phụ thuộc bộ dữ liệu DMV.

## Sống Mỹ — tiếng Anh và văn hóa Hoa Kỳ

Mục Sống Mỹ trên trang chủ và thanh điều hướng mở [website GitHub Pages](https://ptoan-pq.github.io/song-my-english-campus/): 43 chủ đề, 195 khối bài đọc có bản dịch và 645 câu luyện tập tương tác. Mã nguồn ở [repo song-my-english-campus](https://github.com/ptoan-pq/song-my-english-campus). Tiến độ Sống Mỹ được lưu riêng tại website đó.

## Thuộc Lòng

Thẻ Thuộc Lòng trên trang chủ mở [website GitHub Pages](https://ptoan-pq.github.io/thuoc-long/) để học thuộc kinh, thơ và lời thoại. Mã nguồn ở [repo thuoc-long](https://github.com/ptoan-pq/thuoc-long). Bài học và tiến độ được lưu riêng trong trình duyệt tại website đó.

## GitHub và triển khai public

- Mã nguồn: https://github.com/ptoan-pq/pht-learning-hub
- Website: https://ptoan-pq.github.io/pht-learning-hub/
- Website tĩnh chạy trên GitHub Pages, không cần tài khoản GPT, API key hoặc dịch vụ OpenAI.
- Nhánh `main` lưu mã nguồn; nhánh `gh-pages` chứa bản xuất website. GitHub Pages tự triển khai mỗi khi nhánh `gh-pages` được cập nhật.

```sh
node build.mjs
node test.mjs
node export-github-pages.mjs /absolute/new-output-directory
```

Để kiểm tra bản GitHub Pages tại máy, đặt thư mục xuất dưới đường dẫn `pht-learning-hub` của máy chủ HTTP rồi mở `/pht-learning-hub/`. Thư mục xuất phải mới mỗi lần chạy. Sau khi kiểm tra, commit toàn bộ bản xuất vào nhánh `gh-pages` và push lên GitHub để cập nhật web public. Dữ liệu học và âm thanh đã được lưu trong repo. Các phòng tiếng Anh, điện ảnh và Sống Mỹ liên kết tới website GitHub Pages riêng.

Khi chuyển từ địa chỉ cũ, vào **Tiến độ** ở web cũ để xuất JSON, rồi nhập tại **Tiến độ** của web mới. Tiến độ không tự chuyển giữa các tên miền.

## Thư viện Nikāya

Thẻ Nikāya và thanh điều hướng mở https://ptoan-pq.github.io/thu-vien-nikaya/. Thư viện có danh sách kinh gọn, tóm lược theo từng mục và liên kết nguyên văn BuddhaSasana. Biểu tượng bánh xe trong thư viện đưa về trang chủ thư viện.
