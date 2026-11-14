import { randomBytes } from 'crypto';

export const PHOTO_BUCKET = 'magic-frame';

// 고객 사진 경로: photos/{고객ID}/{무작위 32자}.jpg
// 버킷이 공개라서 주소를 아는 사람은 사진을 열 수 있다. 고객 ID 만으로는 주소를 만들 수 없게 무작위 이름을 쓴다.
export function newPhotoPath(userId: string): string {
    return `photos/${userId}/${randomBytes(16).toString('hex')}.jpg`;
}

// DB 의 image_url(공개 주소, ?v= 포함 가능)에서 버킷 안 경로를 꺼낸다. 이 버킷 주소가 아니면 null.
export function photoPathFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const m = url.split('?')[0].match(/\/object\/public\/magic-frame\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
}
