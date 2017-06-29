import java.time.*;

class MyProg01 {

  private String time;

  public static void main(String[] args) {

    MyProg01 app = new MyProg01();
    app.loop();

  }

  void loop() {

   int jjj = 0;

    while(true) {
      time();
      jjj++;
    }
  }

  void time() {

    try {

      this.time = LocalDateTime.now().toString();
      Thread.sleep(1000);

    } catch(Exception e) {
      e.printStackTrace();
    }

  }

}