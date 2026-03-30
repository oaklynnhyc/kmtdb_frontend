import { BookOpen, Info, ScrollText } from 'lucide-react';

export function EditorialNotes() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="ink-header text-white py-16 relative">
        <div className="top-ink-wash"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl mb-3 brush-title">凡例</h1>
          <p className="text-gray-200 text-lg">
            職名錄資料編輯體例與使用說明
          </p>
        </div>
        <div className="bottom-ink-wash"></div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Part 1: 初版編輯例言 */}
        <div className="paper-card rounded-lg seal-corner">
          <div className="p-8 space-y-8">
            <section>
              <div className="flex items-center space-x-3 mb-6 seal-left">
                <ScrollText className="w-5 h-5 text-[#16a085]" />
                <h2 className="text-xl font-medium ink-text">
                  中華民國八十三年初版編輯例言
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

        <div className="my-8"></div>

        {/* Part 2: 資料庫凡例 */}
        <div className="paper-card rounded-lg seal-corner">
          <div className="p-8 space-y-8">
            <section>
              <div className="flex items-center space-x-3 mb-6 seal-left">
                <BookOpen className="w-5 h-5 text-[#16a085]" />
                <h2 className="text-xl font-medium ink-text">
                  國立政治大學圖書館中國國民黨職名錄資料庫凡例
                </h2>
              </div>
              <ol className="list-none space-y-5 text-gray-700 leading-relaxed pl-4">
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">一、</span>
                  本資料庫以《中國國民黨職名錄》（劉維開編輯，臺北市：中國國民黨黨史會，1994）為底本，並參照《中国国民党职名录(1894-1994)》（劉維開編輯，北京市：中華書局，2014）進行校對增補。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">二、</span>
                  本資料庫收錄原書各時期概述，以利讀者理解組織沿革及演變。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">三、</span>
                  人名以原書照錄為原則，明顯誤植者修正，其餘照錄。同時本資料庫參照「NBINet人名權威查詢系統」，本名與別名均可查詢。然為避免系統顯示亂碼，異體字改為通用字。例如：羣→群，啓→啟，峯→峰。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">四、</span>
                  黨團合併姓名不一致者，依「三民主義青年團第二屆中央幹事中央監察暨候補幹事候補監察簡歷冊」(《大溪檔案(黨務類)》，大黨043/014)校正。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">五、</span>
                  本資料庫針對同名同姓者進行重名查驗，以國史館及本館中國國民黨黨史檔案探索系統為查驗資料來源。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">六、</span>
                  職位由選舉產生者，例如中央執行委員(含候補)及中央監察委員(含候補)，依原書順序排序，遞補者接續排序。
                </li>
                <li className="relative pl-8">
                  <span className="absolute left-0 top-0 ink-text font-medium">七、</span>
                  原書未註記亡故日期者，以中央社訊/中央日報發布新聞所載日期為查驗資料來源。
                </li>
              </ol>
            </section>

            <div className="cloud-divider"></div>

            {/* 欄位著錄說明 */}
            <section>
              <div className="flex items-center space-x-3 mb-6 seal-left">
                <Info className="w-5 h-5 text-[#16a085]" />
                <h2 className="text-xl font-medium ink-text">
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
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">組織</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        甲編各時期組織名稱。乙編之中國國民黨。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">一級單位</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        甲編本部一級單位。乙編第一至六屆中央執行、監察委員會，第七至十四屆中央委員會，三民主義青年團與中央改造委員會亦列入一級單位。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">二級單位</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        一級單位下轄之直屬單位。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">三級單位</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        二級單位下轄之直屬單位。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">職位</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職務名稱。依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">姓名</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書著錄，例外著錄原則如上述。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">別名</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依「NBINet人名權威查詢系統」增補。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">屆次</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書屆次著錄。中改會列於第六屆中央執行、監察委員會，三青團依原書另列。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">起始日期</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職位起始日期。原書有明確日期者，依原書著錄。選舉產生者，以選出日期為起始日期。原書如未著錄日期者，欄位留白。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">起始日期來源／原因</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職位任用通過之會議或主席指派等任命方式。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">產生方式</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">結束日期</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職位結束日期。原書有明確日期者，依原書著錄。選舉產生者，如中央執行委員(含候補)、中央監察委員(候補)、中央評議委員等，以下屆全國代表大會開會前一天為結束日期。中央常務委員以下屆中央委員會全體會議開會前一天為結束日期，如無下屆者，以下屆全國代表大會開會前一天為結束日期。如有明確離職原因如另有任用或亡故者，以該日期為結束日期。原書如未著錄日期者，欄位留白。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">結束日期來源／原因</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職位結束之會議或主席指派等任命方式。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">離職原因</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">前任姓名</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">後任姓名</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">兼／代</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">調／升任單位職稱</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        結束任期後調/升任之單位，依原書著錄。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">其他備註</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        其他需說明之事項。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">會議地點</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        會議召開之城市。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">其他出處來源</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職名錄原書以外之參考資料。
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium ink-text align-top whitespace-nowrap">序位</td>
                      <td className="px-4 py-3 text-gray-700 leading-relaxed">
                        職位由選舉產生者，依原書順序給予號碼，遞補者號碼接續。
                      </td>
                    </tr>
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
