// ── artists.ts — SM 아티스트 데이터 (저작권 안전 버전) ─────────
// 실제 가사 없음. 파트 구조·멤버 분배·섹션 정보만 포함.
// 표시 형식: "[Karina — 1절 A멜로]" "[ALL — 후렴]" 등

export type MemberName =
  | 'Karina' | 'Giselle' | 'Winter' | 'Ningning'   // aespa
  | 'Shotaro' | 'Sungchan' | 'Eunseok' | 'Seunghan' | 'Wonbin' | 'Sohee' | 'Anton'; // RIIZE

export interface SongPart {
  id: string;
  member: MemberName | 'ALL' | 'UNIT';
  section: string;   // "1절 A멜로" "후렴 1" "브릿지" 등
  note: string;      // 파트 특성 메모 (무대 연출, 보컬 특징 등)
  tactileNote: string; // DotPad 출력용 한 줄 설명
}

export interface ArtistSong {
  id: string;
  title: string;
  year: number;
  concept: string;
  parts: SongPart[];
  emblems: string[];  // 이 곡에 쓸 엠블럼 preset id 목록
}

export interface Artist {
  id: string;
  name: string;
  nameKo: string;
  color: string;         // 팀 대표 컬러
  accentColor: string;   // 보조 컬러
  pinColor: string;      // DotPad 핀 글로우 컬러
  members: MemberName[];
  memberColors: Record<string, string>;
  tagline: string;
  songs: ArtistSong[];
  emblems: string[];     // 팀 전용 엠블럼 preset id 목록
}

// ── aespa ──────────────────────────────────────────────────────
export const AESPA: Artist = {
  id: 'aespa',
  name: 'aespa',
  nameKo: '에스파',
  color: '#c084fc',       // 퍼플
  accentColor: '#e879f9',
  pinColor: '#c084fc',
  members: ['Karina', 'Giselle', 'Winter', 'Ningning'],
  memberColors: {
    Karina:   '#ff2d78',
    Giselle:  '#c084fc',
    Winter:   '#4dd7ff',
    Ningning: '#ffd400',
    ALL:      '#e879f9',
    UNIT:     '#9aa4b5',
  },
  tagline: 'We, aespa — æ와 현실 자아가 공존하는 세계관',
  emblems: ['ae-symbol', 'ae-butterfly', 'ae-portal', 'ae-wordmark'],
  songs: [
    {
      id: 'aespa-supernova',
      title: 'Supernova',
      year: 2024,
      concept: '에너지가 임계점을 넘는 순간의 폭발적 감각. 초신성처럼 터지는 무대 연출.',
      emblems: ['ae-symbol', 'ae-portal'],
      parts: [
        { id: 'sn-01', member: 'Karina',   section: '인트로', note: '솔로 오프닝, 강렬한 첫 라인', tactileNote: 'Karina — 인트로 솔로 오프닝' },
        { id: 'sn-02', member: 'Winter',   section: '1절 A멜로', note: '몽환적 보컬 레이어', tactileNote: 'Winter — 1절 A멜로 보컬' },
        { id: 'sn-03', member: 'Giselle',  section: '1절 B멜로', note: '랩 브릿지 연결', tactileNote: 'Giselle — 1절 B멜로 랩' },
        { id: 'sn-04', member: 'Ningning', section: '1절 C멜로', note: '상승하는 하이노트', tactileNote: 'Ningning — 1절 C멜로 하이노트' },
        { id: 'sn-05', member: 'ALL',      section: '후렴 1', note: '전원 유니즌, 파워풀 코러스', tactileNote: 'ALL — 후렴 1 유니즌' },
        { id: 'sn-06', member: 'Karina',   section: '2절 A멜로', note: 'æ 버전 인격 전환 연출', tactileNote: 'Karina — 2절 æ 퍼소나' },
        { id: 'sn-07', member: 'Winter',   section: '2절 B멜로', note: '소프트 → 강렬 다이나믹', tactileNote: 'Winter — 2절 B멜로' },
        { id: 'sn-08', member: 'UNIT',     section: '댄스 브레이크', note: 'Karina+Giselle 듀엣 브레이크', tactileNote: 'Karina·Giselle — 댄스 브레이크' },
        { id: 'sn-09', member: 'Ningning', section: '브릿지', note: '전곡 최고음, 클라이맥스 진입', tactileNote: 'Ningning — 브릿지 최고음' },
        { id: 'sn-10', member: 'ALL',      section: '후렴 2 (아웃트로)', note: '초신성 폭발 연출, 총 4인 포메이션', tactileNote: 'ALL — 아웃트로 피날레' },
      ],
    },
    {
      id: 'aespa-whiplash',
      title: 'Whiplash',
      year: 2024,
      concept: '디지털과 현실의 경계가 무너지는 순간. 빠른 전환과 충격의 연속.',
      emblems: ['ae-butterfly', 'ae-symbol'],
      parts: [
        { id: 'wh-01', member: 'Giselle',  section: '인트로 랩', note: '쿨한 영어 랩 오프닝', tactileNote: 'Giselle — 인트로 랩 오프닝' },
        { id: 'wh-02', member: 'Karina',   section: '1절 A멜로', note: '도발적 보컬 텍스처', tactileNote: 'Karina — 1절 A멜로' },
        { id: 'wh-03', member: 'Ningning', section: '1절 B멜로', note: '스택 보컬 레이어링', tactileNote: 'Ningning — 1절 B멜로 스택' },
        { id: 'wh-04', member: 'ALL',      section: '후렴 1', note: '훅 반복, 응원봉 웨이브 포인트', tactileNote: 'ALL — 후렴 1 훅' },
        { id: 'wh-05', member: 'Winter',   section: '2절 A멜로', note: '섬세한 감정 표현', tactileNote: 'Winter — 2절 A멜로' },
        { id: 'wh-06', member: 'UNIT',     section: '브릿지', note: 'Winter+Ningning 하모니', tactileNote: 'Winter·Ningning — 브릿지 하모니' },
        { id: 'wh-07', member: 'ALL',      section: '최종 후렴 + 아웃트로', note: '전원 피날레, 조명 전환 포인트', tactileNote: 'ALL — 최종 후렴 피날레' },
      ],
    },
    {
      id: 'aespa-drama',
      title: 'Drama',
      year: 2023,
      concept: 'æ 세계관의 절정. 현실과 가상의 드라마틱한 충돌.',
      emblems: ['ae-portal', 'ae-wordmark'],
      parts: [
        { id: 'dr-01', member: 'Winter',   section: '인트로', note: '서정적 첫 라인, 분위기 세팅', tactileNote: 'Winter — 인트로 서정 오프닝' },
        { id: 'dr-02', member: 'Ningning', section: '1절 A멜로', note: '파워풀 하이노트 시작', tactileNote: 'Ningning — 1절 A멜로' },
        { id: 'dr-03', member: 'ALL',      section: '프리코러스', note: '4인 라운드 보컬', tactileNote: 'ALL — 프리코러스 라운드' },
        { id: 'dr-04', member: 'ALL',      section: '후렴 1', note: '드라마틱 피크, 포메이션 전환', tactileNote: 'ALL — 후렴 1 드라마틱 피크' },
        { id: 'dr-05', member: 'Karina',   section: '2절 랩+보컬', note: '연기+퍼포먼스 하이브리드', tactileNote: 'Karina — 2절 퍼포먼스' },
        { id: 'dr-06', member: 'Giselle',  section: '브릿지 랩', note: '스토리텔링 랩, 서사 전환점', tactileNote: 'Giselle — 브릿지 랩 서사' },
        { id: 'dr-07', member: 'ALL',      section: '아웃트로', note: '해소의 카타르시스, 전원 합창', tactileNote: 'ALL — 아웃트로 카타르시스' },
      ],
    },
  ],
};

// ── RIIZE ───────────────────────────────────────────────────────
export const RIIZE: Artist = {
  id: 'riize',
  name: 'RIIZE',
  nameKo: '라이즈',
  color: '#f97316',       // 오렌지
  accentColor: '#fb923c',
  pinColor: '#f97316',
  members: ['Shotaro', 'Sungchan', 'Eunseok', 'Seunghan', 'Wonbin', 'Sohee', 'Anton'],
  memberColors: {
    Shotaro:  '#4dd7ff',
    Sungchan: '#f97316',
    Eunseok:  '#ffd400',
    Seunghan: '#ff2d78',
    Wonbin:   '#c084fc',
    Sohee:    '#41d98d',
    Anton:    '#fb923c',
    ALL:      '#f97316',
    UNIT:     '#9aa4b5',
  },
  tagline: 'RIIZE — 청춘의 에너지, 7인의 빛',
  emblems: ['riize-lightning', 'riize-crown', 'riize-star7', 'riize-wordmark'],
  songs: [
    {
      id: 'riize-getabit',
      title: 'Get A Guitar',
      year: 2023,
      concept: '풋풋한 설렘과 자유. 기타 리프처럼 튀어오르는 청춘의 감각.',
      emblems: ['riize-lightning', 'riize-star7'],
      parts: [
        { id: 'ga-01', member: 'Shotaro',  section: '인트로 댄스', note: '비트 드롭 전 솔로 무브', tactileNote: 'Shotaro — 인트로 댄스 솔로' },
        { id: 'ga-02', member: 'Wonbin',   section: '1절 A멜로', note: '리드 보컬 첫 라인', tactileNote: 'Wonbin — 1절 A멜로 리드' },
        { id: 'ga-03', member: 'Seunghan', section: '1절 B멜로', note: '감성적 보컬 연결', tactileNote: 'Seunghan — 1절 B멜로' },
        { id: 'ga-04', member: 'Eunseok',  section: '1절 C멜로', note: '힘 있는 브릿지 연결음', tactileNote: 'Eunseok — 1절 C멜로' },
        { id: 'ga-05', member: 'ALL',      section: '후렴 1', note: '7인 유니즌, 기타 훅 포인트', tactileNote: 'ALL — 후렴 1 기타 훅' },
        { id: 'ga-06', member: 'Sungchan', section: '2절 랩', note: '스웨거 있는 랩 브릿지', tactileNote: 'Sungchan — 2절 랩' },
        { id: 'ga-07', member: 'Anton',    section: '2절 B멜로', note: '영어 라인 포함, 글로벌 감성', tactileNote: 'Anton — 2절 영어 라인' },
        { id: 'ga-08', member: 'Sohee',    section: '프리코러스', note: '긴장감 고조 보컬', tactileNote: 'Sohee — 프리코러스' },
        { id: 'ga-09', member: 'ALL',      section: '후렴 2 + 아웃트로', note: '7인 에너지 폭발, 떼창 포인트', tactileNote: 'ALL — 후렴 2 피날레' },
      ],
    },
    {
      id: 'riize-love101',
      title: 'Love 119',
      year: 2023,
      concept: '위급한 감정의 구조 요청. 가슴이 타는 듯한 설레임.',
      emblems: ['riize-crown', 'riize-lightning'],
      parts: [
        { id: 'l1-01', member: 'Seunghan', section: '인트로 보컬', note: '서정적 감성 오프닝', tactileNote: 'Seunghan — 인트로 서정 보컬' },
        { id: 'l1-02', member: 'Wonbin',   section: '1절 A멜로', note: '부드러운 리드 보컬', tactileNote: 'Wonbin — 1절 A멜로' },
        { id: 'l1-03', member: 'Sohee',    section: '1절 B멜로', note: '청량한 음색', tactileNote: 'Sohee — 1절 B멜로' },
        { id: 'l1-04', member: 'ALL',      section: '후렴 1', note: '"119" 훅, 응원봉 콜앤리스폰스', tactileNote: 'ALL — 후렴 1 콜앤리스폰스' },
        { id: 'l1-05', member: 'Eunseok',  section: '2절 보컬', note: '안정감 있는 중음역', tactileNote: 'Eunseok — 2절 보컬' },
        { id: 'l1-06', member: 'UNIT',     section: '댄스 브레이크', note: 'Shotaro+Sungchan 포인트 안무', tactileNote: 'Shotaro·Sungchan — 댄스 브레이크' },
        { id: 'l1-07', member: 'Anton',    section: '브릿지', note: '감정 전환, 영어 믹스', tactileNote: 'Anton — 브릿지' },
        { id: 'l1-08', member: 'ALL',      section: '최종 후렴', note: '전원 클라이맥스', tactileNote: 'ALL — 최종 후렴 클라이맥스' },
      ],
    },
    {
      id: 'riize-impossible',
      title: 'Impossible',
      year: 2024,
      concept: '불가능을 넘어서는 의지. 7인이 하나가 되는 순간.',
      emblems: ['riize-star7', 'riize-wordmark'],
      parts: [
        { id: 'im-01', member: 'Sungchan', section: '인트로 랩', note: '카리스마 있는 오프닝', tactileNote: 'Sungchan — 인트로 랩' },
        { id: 'im-02', member: 'Wonbin',   section: '1절 A멜로', note: '리드 멜로디', tactileNote: 'Wonbin — 1절 A멜로' },
        { id: 'im-03', member: 'Seunghan', section: '1절 B멜로', note: '감성 보컬 레이어', tactileNote: 'Seunghan — 1절 B멜로' },
        { id: 'im-04', member: 'ALL',      section: '후렴 1', note: '강렬한 훅, 포메이션 피크', tactileNote: 'ALL — 후렴 1' },
        { id: 'im-05', member: 'Eunseok',  section: '2절 솔로', note: '파워풀 보컬 쇼케이스', tactileNote: 'Eunseok — 2절 솔로' },
        { id: 'im-06', member: 'Shotaro',  section: '댄스 인터루드', note: '센터 퍼포먼스', tactileNote: 'Shotaro — 댄스 인터루드' },
        { id: 'im-07', member: 'Anton',    section: '브릿지', note: '영어+한국어 믹스, 감정 정점', tactileNote: 'Anton — 브릿지 정점' },
        { id: 'im-08', member: 'ALL',      section: '아웃트로 피날레', note: '7인 동시 클라이맥스', tactileNote: 'ALL — 아웃트로 피날레' },
      ],
    },
  ],
};

export const ARTISTS = [AESPA, RIIZE] as const;
export type ArtistId = 'aespa' | 'riize';

export function getArtist(id: ArtistId): Artist {
  return id === 'aespa' ? AESPA : RIIZE;
}
