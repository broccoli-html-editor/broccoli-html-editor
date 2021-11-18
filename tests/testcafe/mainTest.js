import {Selector, RequestMock} from 'testcafe';

fixture('Broccoli UI Test')
  .page('http://127.0.0.1:8088/tests/testdata/htdocs/index.php');

test('panels', async t => {
  const $panels = await Selector('.broccoli--panels');
  await t
    .wait(1000)
    .expect($panels.exists).ok()
    .expect($panels.count).eql(1)
    .expect((await Selector('.broccoli--panels')).hasClass('broccoli')).ok();
});
