# Informasi Billing Firebase Storage

Halo! Anda bertanya tentang bagaimana cara membayar Firebase Storage. Berikut adalah penjelasannya.

## Model Pembayaran Firebase (Blaze Plan)

Proyek Firebase Anda menggunakan paket **Blaze (bayar sesuai pemakaian)**. Ini berarti Anda mendapatkan kuota gratis setiap bulan, dan Anda hanya membayar untuk sumber daya yang Anda gunakan di atas kuota gratis tersebut.

### Kuota Gratis Firebase Storage

Setiap bulan, Anda mendapatkan kuota gratis yang cukup besar. Untuk Cloud Storage, kuota gratisnya mencakup:

*   **5 GB** penyimpanan data.
*   **1 GB** data yang diunduh per hari.
*   **20.000** operasi upload per hari.
*   **50.000** operasi download per hari.

Bagi sebagian besar aplikasi baru atau skala kecil, kuota gratis ini lebih dari cukup. Anda tidak akan ditagih apa pun selama penggunaan Anda masih di bawah batas ini.

## Bagaimana Cara Membayarnya?

1.  **Akun Penagihan Google Cloud:** Proyek Firebase Anda terhubung ke **Akun Penagihan Google Cloud**. Di sinilah semua pembayaran dikelola. Anda biasanya sudah menautkan ini saat membuat proyek atau saat mengaktifkan fitur berbayar.
2.  **Metode Pembayaran:** Anda dapat menambahkan metode pembayaran seperti kartu kredit atau debit ke Akun Penagihan Google Cloud Anda. Tagihan akan dibebankan ke metode pembayaran tersebut jika penggunaan Anda melebihi kuota gratis.
3.  **Mengelola Anggaran:** Di **Google Cloud Console**, Anda dapat mengatur **anggaran (budgets)** dan **pemberitahuan (alerts)**. Misalnya, Anda bisa mengatur agar mendapatkan email jika tagihan Anda diperkirakan akan melebihi $5. Ini sangat berguna untuk mengontrol biaya dan menghindari tagihan tak terduga.

## Di Mana Saya Bisa Melihat Ini?

*   Buka **Firebase Console** proyek Anda.
*   Klik ikon gerigi (⚙️) di pojok kiri atas, lalu pilih **Usage and billing**.
*   Di halaman ini, Anda akan melihat ringkasan penggunaan Anda untuk semua layanan Firebase, termasuk Storage. Anda juga akan melihat paket penagihan Anda (Blaze) dan tautan ke akun Google Cloud Billing yang terhubung.

Singkatnya, Anda tidak perlu membayar apa pun sekarang. Cukup fokus pada pengembangan aplikasi Anda. Sistem akan menagih Anda secara otomatis hanya jika penggunaan Anda melampaui kuota gratis yang sangat besar.

Semoga ini membantu!
