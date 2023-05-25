## scale_teams (begin_at으로 가져오는 중) // created_at으로 가져와야 하나?

- https://api.intra.42.fr/v2/scale_teams?filter[cursus_id]=21&filter[campus_id]=29&page[size]=100&range[begin_at]=2015-03-31T15:00:00.000Z,2023-04-10T14:59:59.999Z
- truant: 평가 취소를 뜻함
- feedback === null && truant === {} 인 경우, 블랙홀/giveup/인턴/단순히 피드백 작성 안한채로 방치 등 여러 사유가 있음. 따로 관리가 필요해보임.
  - 당시 team의 status를 보는게 도움이 될 듯?
- { "team.status": {$ne: "finished"} } 인 경우 이론상 모두 재시도 해야함...
  - 하지만 2년 이상 과제같은 경우는 사실상 안해도 되지 않을지?

---

## teams (updated_at)

- 'https://api.intra.42.fr/v2/cursus/21/teams?page[size]=100&filter[campus]=29&range[created_at]=2015-03-31T15:00:00.000Z,2023-04-10T14:59:59.999Z'

---

## coalitions_users (created_at)

- https://api.intra.42.fr/v2/coalitions/85/coalitions_users?range[created_at]=2015-03-31T15:00:00.000Z,2023-04-11T14:59:59.999Z
- https://api.intra.42.fr/v2/coalitions/86/coalitions_users?range[created_at]=2015-03-31T15:00:00.000Z,2023-04-11T14:59:59.999Z
- https://api.intra.42.fr/v2/coalitions/87/coalitions_users?range[created_at]=2015-03-31T15:00:00.000Z,2023-04-11T14:59:59.999Z
- https://api.intra.42.fr/v2/coalitions/88/coalitions_users?range[created_at]=2015-03-31T15:00:00.000Z,2023-04-11T14:59:59.999Z
- 99962,99754,99982,98364,98274,98003,98321 해당 user_id를 갖고 있는 사람들만 중복으로 coalitions_users가 생성되어 있음.
- score가 현시점 전체 코알리숑 순위 조회하기 편하긴 함. 단, 과거 이력은 알 수 없고, 계속 모든 유저들을 업데이트 해야하는 문제가 있음.
  - 사실 전부 업데이트 하는 건 향후 42 서울 사람이 엄청나게 늘어나도 요청 50개면 될텐데, 거기서 중복되는 사람들을 처리해야하는 문제가 남아있음.
  - 현재 dump에는 중복되는 사람들의 데이터를 하나씩 지워둔 상태. 이 방식을 유지할 경우, insert 로직을 만들어야할듯.
    - 거의 동시에 만들어지긴 하지만, 근소하게 먼저 만들어진 데이터를 사용하는 것으로 보임.
- 이거 간혹 달이 바뀌어도 갱신이 안됨
  - byeukim

---

## projects (created_at)

- 'https://api.intra.42.fr/v2/cursus/21/projects?range[created_at]=2010-03-31T15:00:00.000Z,2023-04-11T14:59:59.999Z&page[size]=30'
- 너무 느려서 그런지 타임아웃 에러가 자주 발생. page size를 30으로 줄여서 했음. hint는 3.

---

## projects_users

- filter 에 cursus id 걸어도 작동 안함.
- 어째서인지 campus filter도 cursus_users 와 다른 방식

---

## scores

- 4월 17일 23:59분 기준
- range 기능이 없다... api 보낼 때 직접 filter로 잘라야할듯.
- 생각해보면 validate 해야하는게 날짜밖에 없음
- coalition 자체에 들어가는 점수 예외를 잘 처리해야함

---

## cursus_users

- campus filter 는 transfer 한 사람들을까지 걸러냄.

---

## users

- 계정마다 beginAt 이 같은 기수여도 조금씩 다름 ㅋㅋㅋ
- susong (블랙홀 갔다 옴)
- polarbear
- hwlee ('staff?': true)
- jalee (kind: external)
- floppy (name: 임현동)
- 레벨이 간혹 소숫점으로 길게 늘어지는 경우가 있음
- mnyo
- ruiz
- 3b3-74123
- hworld

- scale team에만 있는 유저들이 있음
  148890
  95903
  83403
  83404
  68830
  51965
  85776
  85942
  143584

- 현재는 전체 유저 목록 테이블 기준으로 작업 중

---

## quests_users

- libft 깨기까지 100일 걸린 계정도 몇 보임. 블랙홀 연장 + 코로나 휴학일듯
- 군휴학은 현재 기준 500일 필터 걸면 될듯... 군인인데 피신 불가능할테니까...
- 가끔 teams 정렬 안됨 ㅡㅡ

---

## exams

- range 를 걸어서 요청을 보내면 중복된 exam 이 나오는 현상이 있음. 인트라에 버그 고쳐주기 전까진 수동으로 해결해야함

---

## events

- event nbr subscription이랑 실제 구독 인원이랑 다른 경우가 있음
- events_users campus filter 안먹힘

---

## experiences

- 간혹 경험치가 들어올 상황이 전혀 아닌 사람들에게 경험치가 부여되는 문제가 있음
- 간혹 경험치가 들어와야 하는 양 보다 더 많이 들어오는 경우가 있음
- experiencable_id 는 projects_user 당 하나임
- 과제 진행한 것을 초기화하는 경우 어떻게 처리되는지?
- 트렌센던스 통과 시 경험치가 미세하게 어긋나는 경우가 있음

---

## locations

- dohykim 이 이상한 자리에 앉은 기록이 몇번 있음 ("C02ZM0AUJV3Y", locationId: 12117624)
  - 유사한 경우가 두명 더 있음 (총합 22개의 location)
- location은 숫자가 매우 많기 때문에, upsert 를 무분별하게 (데이터를 한꺼번에 많이 받아오는 경우) 사용하면 지나치게 느리다.
- 예전 데이터 중, student.42seoul.kr 이메일을 갖고 있지 않은 계정들이 다수 있다.

---

## etc

- 42 api 가끔 db query 에러문 그대로 나옵니다... 가슴이 웅장해진다...
- response header 를 보면, page 에 관련된 정보가 있다.
- response header 를 보면, rate limit 에 관련된 정보들이 있는데, 이로 미루어보아 인트라에서는 응답할때 secondly limit 을 측정하는 것으로 보임.<br/>
  때문에 보내는 쪽에서 rate limit 에 안걸리게 보내는 것은 사실상 불가능하고, 요청 실패에 대한 재시도 로직을 만드는게 맞다는 결론이 나옴.
