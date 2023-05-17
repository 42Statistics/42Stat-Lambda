### 타입

- 단수형이 기본

### 풀더 구조

```
src
|- 타입 이름
    |- api
       |- 타입 이름.api.ts: 타입 정의, endpoint, 예외 정의
       |- 타입 이름.schema.ts: 타입의 zod 스키마 정의
    |- dto
        |- 타입 이름.redis.ts: redis 에 저장할 데이터 타입 정의
    |- 타입 이름 + Updator.ts: 실제로 데이터를 받아오는 로직 정의
```

### 클래스

- 타입 이름 + Updator

### 변수

- endpoint 가 filter 등 인자를 받는 경우 => 해당 endpoint 에서 처리하고자 하는 상황
- endpoint 가 아무 인자도 받지 않는 경우 => 해당 endpoint 에서 반환하는 데이터 타입 이름
- 42 intra 에서 받아온 데이터들 => 타입이름 + Dtos

### api 마다 정의해야 하는 함수

- 복수의 dto 들을 파싱해주는 함수 => parse + 타입 이름 + s
