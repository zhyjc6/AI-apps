import React, { useState, useEffect } from 'react';

// 定义天干和地支
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 地支对应的时辰范围 (标准时间，例如北京时间，简化处理)
// 子时跨越午夜，因此分为夜子时(23:00-23:59)和早子时(00:00-00:59)
// 在八字中，通常将23:00-00:59都归为子时，但日柱的更替在00:00。
// 此处按传统时辰划分，2小时一个时辰。
const BRANCH_HOURS = [
    { branch: '子', startHour: 23, endHour: 1 }, // 23:00 - 00:59 (跨越午夜)
    { branch: '丑', startHour: 1, endHour: 3 },  // 01:00 - 02:59
    { branch: '寅', startHour: 3, endHour: 5 },  // 03:00 - 04:59
    { branch: '卯', startHour: 5, endHour: 7 },  // 05:00 - 06:59
    { branch: '辰', startHour: 7, endHour: 9 },  // 07:00 - 08:59
    { branch: '巳', startHour: 9, endHour: 11 }, // 09:00 - 10:59
    { branch: '午', startHour: 11, endHour: 13 }, // 11:00 - 12:59
    { branch: '未', startHour: 13, endHour: 15 }, // 13:00 - 14:59
    { branch: '申', startHour: 15, endHour: 17 }, // 15:00 - 16:59
    { branch: '酉', startHour: 17, endHour: 19 }, // 17:00 - 18:59
    { branch: '戌', startHour: 19, endHour: 21 }, // 19:00 - 20:59
    { branch: '亥', startHour: 21, endHour: 23 }  // 21:00 - 22:59
];

// 简化版节气日期 (仅用于月柱大致判断，非精确天文计算，不考虑年份差异)
// 实际精确的八字排盘需要根据每年的精确节气时间（精确到分钟），
// 这通常需要专业的农历/天文库支持或庞大的数据库。
// 此处仅为演示目的，提供一个近似的日期。
const SOLAR_TERMS_APPROX_DATE = [
    { month: 2, day: 4, name: '立春', branch: '寅' }, // 约2月4日
    { month: 3, day: 5, name: '惊蛰', branch: '卯' }, // 约3月5日
    { month: 4, day: 4, name: '清明', branch: '辰' }, // 约4月4日
    { month: 5, day: 5, name: '立夏', branch: '巳' }, // 约5月5日
    { month: 6, day: 5, name: '芒种', branch: '午' }, // 约6月5日
    { month: 7, day: 6, name: '小暑', branch: '未' }, // 约7月6日
    { month: 8, day: 7, name: '立秋', branch: '申' }, // 约8月7日
    { month: 9, day: 7, name: '白露', branch: '酉' }, // 约9月7日
    { month: 10, day: 8, name: '寒露', branch: '戌' }, // 约10月8日
    { month: 11, day: 7, name: '立冬', branch: '亥' }, // 约11月7日
    { month: 12, day: 6, name: '大雪', branch: '子' }, // 约12月6日
    { month: 1, day: 5, name: '小寒', branch: '丑' }  // 约1月5日 (次年)
];


// 获取天干地支的组合 (60甲子)
const getSixtyJiazi = () => {
    const jiazi = [];
    for (let i = 0; i < 60; i++) {
        jiazi.push(HEAVENLY_STEMS[i % 10] + EARTHLY_BRANCHES[i % 12]);
    }
    return jiazi;
};
const SIXTY_JIAZI = getSixtyJiazi();

// 计算日柱 (基于一个已知基准日期的简化方法)
// 1900年1月1日 (公历) 普遍认为是 戊戌日 (SIXTY_JIAZI[34])。
// 然而，为了使示例 1991年1月1日 (己卯日 SIXTY_JIAZI[15]) 的计算结果正确，
// 且考虑到日柱计算的绝对对齐复杂性，我们调整 1900年1月1日的基准索引。
// 经计算，1900-01-01 到 1991-01-01 共有 33237 天。
// 33237 % 60 = 57。
// 期望结果 己卯日 (SIXTY_JIAZI[15])。
// 设基准索引为 X: (X + 33237) % 60 = 15  => (X + 57) % 60 = 15
// 解得 X = (15 - 57 + 60) % 60 = 18。
// 经过用户反馈，1901年1月1日是己卯日。
// 1900年1月1日到1901年1月1日有365天。
// 365 % 60 = 5。
// 己卯日索引为 15。
// 设 1900年1月1日 索引为 X。
// (X + 5) % 60 = 15 => X = (15 - 5 + 60) % 60 = 10。
// 因此，我们将 1900年1月1日的日柱索引设置为 10 (对应甲子日) 以确保计算结果符合用户预期。
const BASE_DATE = new Date('1900-01-01T00:00:00Z'); // Use UTC to avoid timezone issues
const BASE_DATE_JIAZI_INDEX = 10; // Calibrated to 10 (甲子) to match user's provided 1901-01-01 reference

const calculateDayPillar = (year, month, day) => {
    // Create a UTC date object to avoid local timezone effects on date calculation
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    if (isNaN(targetDate.getTime())) {
        return '未知日';
    }

    // Calculate the difference in days from the base date
    const diffTime = targetDate.getTime() - BASE_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate the index of the day pillar in the 60 Jiazi cycle
    let dayIndex = (BASE_DATE_JIAZI_INDEX + diffDays) % 60;
    if (dayIndex < 0) { // Ensure the index is positive
        dayIndex += 60;
    }

    return SIXTY_JIAZI[dayIndex];
};

// Calculate the hour pillar based on the day stem and hour
// Five Rats Escaping Jia (五鼠遁甲歌诀): 甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途。
const getHourPillar = (dayStem, hour) => {
    let hourBranch = '未知';
    for (const range of BRANCH_HOURS) {
        if (range.startHour < range.endHour) { // E.g., Chou Shi 1-3 (01:00-02:59)
            if (hour >= range.startHour && hour < range.endHour) {
                hourBranch = range.branch;
                break;
            }
        } else { // E.g., Zi Shi 23-1 (23:00-00:59, crosses midnight)
            if (hour >= range.startHour || hour < range.endHour) {
                hourBranch = range.branch;
                break;
            }
        }
    }

    if (hourBranch === '未知') {
        return '未知时'; // Unable to match hour
    }

    const hourBranchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);

    let startStemIndex; // Stem index for Zi Shi
    switch (dayStem) {
        case '甲':
        case '己':
            startStemIndex = HEAVENLY_STEMS.indexOf('甲'); // Jia Zi
            break;
        case '乙':
        case '庚':
            startStemIndex = HEAVENLY_STEMS.indexOf('丙'); // Bing Zi
            break;
        case '丙':
        case '辛':
            startStemIndex = HEAVENLY_STEMS.indexOf('戊'); // Wu Zi
            break;
        case '丁':
        case '壬':
            startStemIndex = HEAVENLY_STEMS.indexOf('庚'); // Geng Zi
            break;
        case '戊':
        case '癸':
            startStemIndex = HEAVENLY_STEMS.indexOf('壬'); // Ren Zi
            break;
        default:
            return '未知时';
    }

    const hourStemIndex = (startStemIndex + hourBranchIndex) % 10;
    const hourStem = HEAVENLY_STEMS[hourStemIndex];

    return hourStem + hourBranch;
};


function App() {
    const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD
    const [birthTime, setBirthTime] = useState('12:00'); // HH:MM
    const [baziResult, setBaziResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Get the Year Pillar
    const getYearPillar = (year, month, day) => {
        // The Year Pillar in Bazi is determined by the Start of Spring (立春). If the birth date is before
        // the Start of Spring in that year, the Year Pillar belongs to the previous year.
        // Here, an approximate Start of Spring date (Feb 4th) is used. Precise Bazi calculations require exact solar term times.
        const lichunApprox = SOLAR_TERMS_APPROX_DATE.find(t => t.name === '立春');
        let actualYear = year;
        if (month < lichunApprox.month || (month === lichunApprox.month && day < lichunApprox.day)) {
            actualYear--; // If before Start of Spring, it's considered the previous year
        }

        // Assuming 4 AD is Jia Zi year (甲子年) (this is a reference for the 60 Jiazi cycle, not precise historical fact)
        const yearIndex = (actualYear - 4) % 60;
        return SIXTY_JIAZI[(yearIndex + 60) % 60]; // Ensure the index is positive
    };

    // Get the Month Pillar
    const getMonthPillar = (year, month, day) => {
        // The Month Pillar is determined by solar terms. Each month pillar starts with a specific solar term (e.g., Start of Spring for Yin month).
        // We need to find the solar term period the birth date falls into, i.e., find the last solar term that occurred on or before the birth date.
        // The Earthly Branch corresponding to that solar term is the month branch.
        // Here, approximate solar term dates are used. Precise Bazi calculations require exact solar term times.

        const birthDateTime = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // Birth date (UTC)
        let monthBranch = '未知';
        let definingTerm = null; // The solar term that defines the month pillar

        // Build a list of solar term dates including previous, current, and next year to handle year-crossing solar terms
        const allTermDates = [];
        const yearsToConsider = [year - 1, year, year + 1]; // Consider solar terms from previous, current, and next year

        for (const y of yearsToConsider) {
            for (const term of SOLAR_TERMS_APPROX_DATE) {
                // Create UTC date objects for each solar term
                allTermDates.push({
                    date: new Date(Date.UTC(y, term.month - 1, term.day, 0, 0, 0)),
                    branch: term.branch,
                    name: term.name // For debugging or understanding
                });
            }
        }

        // Sort all solar term dates in chronological order
        allTermDates.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Find the last solar term that occurred on or before the birth date
        for (let i = 0; i < allTermDates.length; i++) {
            const term = allTermDates[i];
            if (birthDateTime >= term.date) {
                definingTerm = term; // Found a matching solar term, continue searching for the next one to ensure it's the last
            } else {
                // If the birth date is earlier than the current solar term, the previously found solar term is the one we need
                break;
            }
        }

        // If definingTerm is still null after the loop, it means the birth date is earlier than all solar terms in our considered range.
        // In practice, this usually means the birth date is before the Minor Cold (小寒) of the current year, so it should fall into the Chou month of the previous year.
        if (!definingTerm) {
            // Theoretically, if the date is within a valid range, here should be able to find a solar term.
            // This situation might occur in rare edge cases or with incomplete data.
            // Default to the Chou month corresponding to Minor Cold as a safety measure.
            definingTerm = SOLAR_TERMS_APPROX_DATE.find(t => t.name === '小寒');
        }

        if (definingTerm) {
            monthBranch = definingTerm.branch;
        } else {
            return '未知月'; // If still not found, return unknown
        }

        // 月干的计算，需要年干
        // 五虎遁月歌诀：甲己之年丙作首，乙庚之岁戊为头，丙辛之岁寻庚上，丁壬壬寅顺水流，戊癸之年何处起，甲寅之上好追求。
        // Note: The year stem used for month stem calculation should be the adjusted year pillar stem (after considering Start of Spring).
        const yearPillarForMonthStem = getYearPillar(year, month, day);
        const yearStem = yearPillarForMonthStem.charAt(0);

        let startMonthStemIndex; // Stem index for Yin month
        switch (yearStem) {
            case '甲':
            case '己':
                startMonthStemIndex = HEAVENLY_STEMS.indexOf('丙'); // Bing Yin
                break;
            case '乙':
            case '庚':
                startMonthStemIndex = HEAVENLY_STEMS.indexOf('戊'); // Wu Yin
                break;
            case '丙':
            case '辛':
                startMonthStemIndex = HEAVENLY_STEMS.indexOf('庚'); // Geng Yin
                break;
            case '丁':
            case '壬':
                startMonthStemIndex = HEAVENLY_STEMS.indexOf('壬'); // Ren Yin
                break;
            case '戊':
            case '癸':
                // FIX: Corrected typo from 'startStemIndex' to 'startMonthStemIndex'
                startMonthStemIndex = HEAVENLY_STEMS.indexOf('甲'); // Jia Yin
                break;
            default:
                return '未知月';
        }

        // Calculate the index of the current month branch (Yin is 0, Mao is 1... Zi is 10, Chou is 11)
        const branchOffset = {
            '寅': 0, '卯': 1, '辰': 2, '巳': 3, '午': 4, '未': 5,
            '申': 6, '酉': 7, '戌': 8, '亥': 9, '子': 10, '丑': 11
        };
        const monthBranchIndex = branchOffset[monthBranch];

        if (monthBranchIndex === undefined) {
            return '未知月';
        }

        // Calculate the month stem
        const monthStemIndex = (startMonthStemIndex + monthBranchIndex) % 10;
        const currentMonthStem = HEAVENLY_STEMS[monthStemIndex];

        return currentMonthStem + monthBranch;
    };


    const calculateBazi = () => {
        setErrorMessage('');
        setBaziResult(null);

        if (!birthDate || !birthTime) {
            setErrorMessage('请选择出生日期和时间。');
            return;
        }

        const dateObj = new Date(`${birthDate}T${birthTime}:00`); // Use ISO format
        if (isNaN(dateObj.getTime())) {
            setErrorMessage('无效的日期或时间。');
            return;
        }

        let year = dateObj.getFullYear();
        let month = dateObj.getMonth() + 1; // getMonth() returns 0-11
        let day = dateObj.getDate();
        const hour = dateObj.getHours();
        // const minute = dateObj.getMinutes(); // Not used, can be removed

        // === Special handling for Day Pillar: If born between 00:00 - 00:59 (Early Zi Shi), Day Pillar is considered the previous day ===
        // Bazi Day starts at Zi Shi (23:00 of previous day to 00:59 of current day)
        // If birth hour is 00:00 to 00:59, the day pillar is for the previous calendar day.
        let adjustedDayForDayPillar = day;
        let adjustedMonthForDayPillar = month;
        let adjustedYearForDayPillar = year;

        if (hour >= 0 && hour < 1) { // 00:00 - 00:59 (Early Zi Shi)
            const previousDay = new Date(dateObj);
            previousDay.setDate(dateObj.getDate() - 1); // Go back to the previous day
            adjustedYearForDayPillar = previousDay.getFullYear();
            adjustedMonthForDayPillar = previousDay.getMonth() + 1;
            adjustedDayForDayPillar = previousDay.getDate();
        }
        // For 23:00 - 23:59 (Late Zi Shi), the Day Pillar is still for the current day, no adjustment needed.

        // Calculate Year Pillar (Year Pillar determination is still based on Start of Spring, unaffected by Zi Shi crossing midnight)
        const yearPillar = getYearPillar(year, month, day);

        // Calculate Month Pillar (Month Pillar determination is still based on solar terms, unaffected by Zi Shi crossing midnight)
        const monthPillar = getMonthPillar(year, month, day);

        // Calculate Day Pillar (using the adjusted date)
        const dayPillar = calculateDayPillar(adjustedYearForDayPillar, adjustedMonthForDayPillar, adjustedDayForDayPillar);
        const dayStem = dayPillar.charAt(0); // Get the Heavenly Stem of the Day Pillar

        // Calculate Hour Pillar (Hour Pillar directly uses the input hour)
        const hourPillar = getHourPillar(dayStem, hour);

        setBaziResult({
            yearPillar,
            monthPillar,
            dayPillar,
            hourPillar,
            gregorianDate: `${year}年${month}月${day}日`,
            displayTime: birthTime,
        });
    };

    return (
        // Outer div: Ensure it takes full viewport width and height, background, padding
        // Flexbox for vertical and horizontal centering
        <div className="w-screen h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4 font-inter">
            {/* Inner div: The white card. It will be centered by the parent's flex properties. */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-105">
                <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">生辰八字计算器</h1>

                <div className="mb-6">
                    <label htmlFor="birthDate" className="block text-gray-700 text-lg font-semibold mb-2">出生日期 (公历):</label>
                    <input
                        type="date"
                        id="birthDate"
                        // Added bg-white for higher contrast, and a custom class for icon styling
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-lg text-gray-900 bg-white custom-date-time-input"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="birthTime" className="block text-gray-700 text-lg font-semibold mb-2">出生时辰:</label>
                    <input
                        type="time"
                        id="birthTime"
                        // Added bg-white for higher contrast, and a custom class for icon styling
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-lg text-gray-900 bg-white custom-date-time-input"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                    />
                </div>

                <div className="mb-8">
                    <label htmlFor="birthLocation" className="block text-gray-700 text-lg font-semibold mb-2">出生地点 (仅作记录，不参与真太阳时计算):</label>
                    <input
                        type="text"
                        id="birthLocation"
                        // Added bg-white to ensure white background
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-700 text-lg bg-white"
                        placeholder="如 北京市"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        * 精确的八字计算需要根据出生地的经度校正真太阳时，此功能暂未实现。
                    </p>
                </div>

                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
                        <p className="font-bold">错误:</p>
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                )}

                <button
                    onClick={calculateBazi}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-xl"
                >
                    计算生辰八字
                </button>

                {baziResult && (
                    <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-inner border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">您的生辰八字</h2>
                        <div className="text-lg text-gray-700 leading-relaxed">
                            <p className="mb-2"><strong className="text-indigo-600">出生日期 (公历):</strong> {baziResult.gregorianDate}</p>
                            <p className="mb-4"><strong className="text-indigo-600">出生时辰:</strong> {baziResult.displayTime}</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-2xl font-semibold text-gray-900 mb-6">
                                <div className="p-3 bg-blue-100 rounded-md shadow-sm">年柱: <span className="text-blue-700">{baziResult.yearPillar}</span></div>
                                <div className="p-3 bg-green-100 rounded-md shadow-sm">月柱: <span className="text-green-700">{baziResult.monthPillar}</span></div>
                                <div className="p-3 bg-yellow-100 rounded-md shadow-sm">日柱: <span className="text-yellow-700">{baziResult.dayPillar}</span></div>
                                <div className="p-3 bg-red-100 rounded-md shadow-sm">时柱: <span className="text-red-700">{baziResult.hourPillar}</span></div>
                            </div>

                            <p className="text-sm text-red-600 italic mt-4">
                                **重要提示：**
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-600 italic">
                                <li>八字年柱和月柱的划分严格依据**节气**的精确时间（精确到分钟），而非公历月份。此应用中的节气日期为**近似值**，可能导致与专业八字排盘结果的差异。</li>
                                <li>时柱的确定需要根据出生地的**经度**计算**真太阳时**。此应用目前使用标准时间计算时辰，未考虑真太阳时和时区差异，这可能影响时柱的准确性。</li>
                                <li>如需最精确的八字排盘，建议咨询专业的命理师或使用包含精确天文算法的专业软件。</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
