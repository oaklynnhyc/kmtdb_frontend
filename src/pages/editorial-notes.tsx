import { useEffect, useState } from 'react';
import { BookOpen, Info, ScrollText } from 'lucide-react';
import { getEditorialContent, getFieldNotes, type FieldNoteEntry } from '@/services/api';

export function EditorialNotes() {
  const [editorialContent, setEditorialContent] = useState('');
  const [fieldNotes, setFieldNotes] = useState<FieldNoteEntry[]>([]);

  useEffect(() => {
    getEditorialContent()
      .then((rows) => setEditorialContent(rows.map((r) => r.content).join('\n\n')))
      .catch(() => setEditorialContent(''));
    getFieldNotes()
      .then(setFieldNotes)
      .catch(() => setFieldNotes([]));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="ink-header text-white py-10 sm:py-14 lg:py-16 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 brush-title">凡例</h1>
          <p className="text-gray-200 text-sm sm:text-base lg:text-lg">
            中國國民黨職名錄編輯體例與欄位說明
          </p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Part 1: 初版編輯例言 */}
        <div className="paper-card rounded-lg seal-corner">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            <section>
              <div className="flex items-center space-x-3 mb-4 sm:mb-6 seal-left">
                <ScrollText className="w-5 h-5 text-[#16a085] flex-shrink-0" />
                <h2 className="text-base sm:text-xl font-medium ink-text">
                  《中國國民黨職名錄》編輯例言
                </h2>
              </div>
              <ol className="list-none space-y-5 text-gray-700 leading-relaxed pl-4">
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">一、</span>
                  本黨自總理孫中山先生於民國前十八年即西元一八九四年十一月二十四日創建興中會以來，迄今屆滿一百年，本會特輯錄目興中會至本(八十三)年九月之第十四屆中央委員會重要職名，為「中國國民黨職名錄」，以資產查參，並為紀念。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">二、</span>
                  本書內容分為甲、乙兩編，甲編輯錄興中會、中國同盟會、國民黨、中華革命黨及中國國民黨(民國十三年改組前)之職名；乙編自民國十三年第一屆中央執行、監察委員會起，按屆輯錄中央執行委員、中央監察委員、候補中央執行委員、候補中央監察委員、中央評議委員、中央委員、候補中央委員，暨中央黨部各單位正、副主管姓名，並附註相關任免資料。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">三、</span>
                  本書內容於甲、乙兩編中，每一時期前，均有一概述，以明此一時期的重要人事變革及機構之增置或裁撤。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">四、</span>
                  本書引用資料，以本會庫藏史料及會議紀錄為主，中國國民黨工作紀實、大事年表及相關著作為輔。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">五、</span>
                  本書乙編關於中央執行委員、中央監察委員及中央委員出缺遞補，與中央黨部各單位正、副主管任免資料，概依歷次全國代表大會會議紀錄，歷屆中央執行委員會、中央監察委員會及中央委員會之全體會議紀錄，暨歷屆中央執行委員會常務委員會(以下稱中常會)會議紀錄、中央監察委員會(以下簡稱中監會)常務委員會議紀錄及中央委員會常務委員會(以下簡稱中常會會議紀錄)所載，註明任免通過之會議次數及時間於其姓名之下。凡中常會通過者，逕書其所通過會議之次數，凡中監會常務委員會議通過者，則加書中監會字樣。其未經上項會議任免者，則依人事相關資料，書其任免生效日期。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">六、</span>
                  三民主義青年團依中央執行委員會組織條例規定，為中央執行委員會所屬單位，但其組織自成系統，本書將其中央團部自民國二十七年七月成立迄民國三十六年九月黨團合併之職名，另列專章。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">七、</span>
                  本書所紀錄者，為本黨一百年間人事遞嬗情形，惟受限於若干資料的不完整，以及職名人數眾多，闕失疏漏之處，在所難免，尚祈各方人士不吝指教，俟再版時更正。
                </li>
              </ol>
            </section>
          </div>
        </div>

        <div className="my-4 sm:my-8"></div>

        {/* Part 2: 資料庫凡例 */}
        <div className="paper-card rounded-lg seal-corner">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            <section>
              <div className="flex items-center space-x-3 mb-4 sm:mb-6 seal-left">
                <BookOpen className="w-5 h-5 text-[#16a085] flex-shrink-0" />
                <h2 className="text-base sm:text-xl font-medium ink-text">
                  國立政治大學圖書館中國國民黨職名錄檢索系統凡例
                </h2>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-gray-700 pl-4">
                {editorialContent}
              </div>
            </section>

            <div className="cloud-divider"></div>

            {/* 欄位著錄說明 */}
            <section>
              <div className="flex items-center space-x-3 mb-4 sm:mb-6 seal-left">
                <Info className="w-5 h-5 text-[#16a085] flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-medium ink-text">
                  各欄位著錄說明
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm ink-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ width: '140px' }}>
                        欄位
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        說明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldNotes.map((n) => (
                      <tr key={n.id}>
                        <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">{n.field}</td>
                        <td className="px-4 py-3 text-gray-700 leading-relaxed">{n.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
