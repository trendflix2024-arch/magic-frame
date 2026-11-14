// HEIC/HEIF → JPEG 클라이언트 변환 (iPhone 기본 사진 포맷 지원)
// 브라우저 native 디코딩: Safari 만 가능. Chrome/Edge/Android Chrome 은 heic2any 필요.

const HEIC_EXT = /\.(heic|heif)$/i;
const HEIC_MIME = /^image\/(heic|heif|heic-sequence|heif-sequence)$/i;

export function isHeic(file: File): boolean {
    return HEIC_EXT.test(file.name) || HEIC_MIME.test(file.type);
}

// HEIC 면 JPEG Blob 으로 변환, 아니면 원본 반환
export async function ensureJpeg(file: File): Promise<File | Blob> {
    if (!isHeic(file)) return file;

    // dynamic import — heic2any 는 ~140KB, HEIC 사용자만 다운로드
    const heic2any = (await import('heic2any')).default;
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(out) ? out[0] : out;
    // 이름은 .jpg 로 바꿔 후속 코드가 JPEG 으로 인식하도록
    const newName = file.name.replace(HEIC_EXT, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
}
