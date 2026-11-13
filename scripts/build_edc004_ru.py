from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_LEFT

OUT=Path("assets/reports/everyday-claims/EDC-004_ChatGPT_Free_SUPPORTED_RU.pdf")
OUT.parent.mkdir(parents=True,exist_ok=True)
regular="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
bold="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
assert Path(regular).exists() and Path(bold).exists(), "Cyrillic fonts unavailable"
pdfmetrics.registerFont(TTFont("DejaVu",regular))
pdfmetrics.registerFont(TTFont("DejaVu-Bold",bold))
W,H=A4
styles={
 "h":ParagraphStyle("h",fontName="DejaVu-Bold",fontSize=15,leading=19,textColor=colors.HexColor("#10283D"),spaceAfter=6),
 "sub":ParagraphStyle("sub",fontName="DejaVu",fontSize=7.3,leading=11,textColor=colors.HexColor("#556A79"),spaceAfter=14),
 "sec":ParagraphStyle("sec",fontName="DejaVu-Bold",fontSize=9.3,leading=13,textColor=colors.HexColor("#007F88"),spaceBefore=9,spaceAfter=6),
 "body":ParagraphStyle("body",fontName="DejaVu",fontSize=8.1,leading=12.5,textColor=colors.HexColor("#243746"),spaceAfter=7),
 "small":ParagraphStyle("small",fontName="DejaVu",fontSize=7.2,leading=11,textColor=colors.HexColor("#243746"),spaceAfter=5),
 "finding":ParagraphStyle("finding",fontName="DejaVu-Bold",fontSize=12,leading=16,textColor=colors.HexColor("#007F88"),spaceAfter=8),
}
def P(s,k="body"):return Paragraph(s,styles[k])
def draw_page(c,doc):
 c.saveState()
 c.setFillColor(colors.HexColor("#10283D"));c.rect(0,H-116,W,116,fill=1,stroke=0)
 logo=Path("assets/boxvia-logo.png")
 if logo.exists():c.drawImage(str(logo),46,H-70,width=39,height=39,mask="auto",preserveAspectRatio=True)
 c.setFillColor(colors.white);c.setFont("DejaVu-Bold",15);c.drawString(94,H-45,"BoxVia")
 c.setFont("DejaVu",6.4);c.drawString(94,H-61,"INDEPENDENT ANALYSIS / RESEARCH / TECHNOLOGY")
 c.setFont("DejaVu-Bold",8);c.drawString(47,H-91,"BOXVIA / CHECK A CLAIM")
 c.setStrokeColor(colors.HexColor("#DCE6EA"));c.line(47,57,W-47,57)
 c.setFillColor(colors.HexColor("#556A79"));c.setFont("DejaVu",7)
 c.drawString(47,44,"BoxVia | https://boxvia.andeks.workers.dev/")
 c.linkURL("https://boxvia.andeks.workers.dev/",(47,40,290,54),relative=0)
 c.setFont("DejaVu",6.3);c.drawString(47,30,"ANDEKS v0.3 | Ограниченная проверка доказательств; не сертификация")
 c.setFont("DejaVu-Bold",7);c.drawRightString(W-48,30,f"{doc.page} / 2")
 c.restoreState()
doc=SimpleDocTemplate(str(OUT),pagesize=A4,leftMargin=47,rightMargin=47,topMargin=180,bottomMargin=72,title="BoxVia EDC-004 | ChatGPT Free | Технический перевод",author="BoxVia")
story=[
 P("Отчет об оценке доказательств","h"),
 P("Проверка одного утверждения | Методологическая основа: ANDEKS v0.3","sub"),
 P("ID: BV-CC-2026-EDC004 | Дата оценки: 2026-11-13 | Публичный демонстратор","small"),
 P("Дата обращения к источнику: 2026-11-13 (UTC)","small"),
 P("01 Проверяемое утверждение","sec"),
 P("Физическое лицо, использующее ChatGPT Free, может продавать обычные текстовые результаты сервиса при соблюдении применимых условий и правил OpenAI."),
 P("02 Идентифицированный первоисточник","sec"),
 P("Издатель: OpenAI. Документ: What is ChatGPT? (Help Center), раздел «Can I use output from ChatGPT for commercial uses?»."),
 P("URL: https://help.openai.com/en/articles/6783457","small"),
 P("Версия и дата публикации: не установлены; содержимое страницы может изменяться.","small"),
 P("03 Границы оценки","sec"),
 P("Проверяется только подтверждение указанного утверждения выбранным первоисточником. Объект: обычный текстовый результат бесплатного плана ChatGPT. Исключены правовая экспертиза, авторско-правовая охрана, права третьих лиц, API, голосовые и графические результаты."),
 P("04 Доказательства из источника","sec"),
 P("E1. Раздел о коммерческом использовании допускает продажу и коммерческое распространение результатов ChatGPT при соблюдении условий и правил OpenAI."),
 P("E2. Раздел прямо распространяет разрешение на результаты бесплатного и платного планов."),
 P("E3. Разрешение обусловлено соблюдением применимых условий и правил; безусловного разрешения источник не дает."),
 P("05 Статус доказательств","sec"),
 P("SUPPORTED","finding"),
 P("E1–E3 подтверждают ограниченное разрешение на коммерческое использование. Они не подтверждают исключительные права, отсутствие нарушений или гарантии в отношении конкретного результата."),
 PageBreak(),
 P("Обоснование и методологическая запись","h"),
 P("Продолжение отчета BV-CC-2026-EDC004","sub"),
 P("06 Обоснование оценки","sec"),
 P("Соответствие: E1 подтверждает возможность продажи; E2 — применимость к бесплатному плану; E3 — обязательность соблюдения условий."),
 P("Интерпретация: разрешение на коммерческое использование не равнозначно безусловной передаче всех прав интеллектуальной собственности."),
 P("Основание результата: каждый элемент ограниченного утверждения подтвержден указанным источником."),
 P("07 Неопределенности и ограничения","sec"),
 P("Не зафиксирована неизменяемая версия справочной страницы и ее криптографический хеш. Не исследованы конкретный результат, правообладатель, национальное право или сделка. Перед использованием вывода необходимо повторно проверить действующие условия."),
 P("08 Запись о прослеживаемости","sec"),
 P("Источник: OpenAI Help Center, статья 6783457, раздел о коммерческом использовании."),
 P("Доступ: 2026-11-13 (UTC); версия публикации не установлена."),
 P("Обработка: ручная документальная проверка, записи E1–E3; копия первоисточника не приложена."),
 P("Среда: ручная оценка и формирование PDF; выполнение ARE/ERA не заявляется."),
 P("09 Методологическая основа","sec"),
 P("Ограниченная проверка демонстрирует принципы ANDEKS v0.3: прослеживаемость, явные границы и разделение оценки и полномочий на принятие решений. SUPPORTED — обозначение результата BoxVia, а не формальный нормативный статус ANDEKS."),
 P("10 Границы использования и ответственность","sec"),
 P("Вывод ограничен указанным утверждением, источником и границами оценки. Не является сертификацией, юридической консультацией, комплексным аудитом или формальной нормативной оценкой ANDEKS. Решение принимает уполномоченное лицо."),
 P("Подготовлено BoxVia | Independent Analysis, Research &amp; Technology","small"),
]
doc.build(story,onFirstPage=draw_page,onLaterPages=draw_page)
print(OUT)
