const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

// 音乐文件目录
const musicDir = path.join(__dirname, 'public', 'music');
// 音乐列表文件
const musicListFile = path.join(__dirname, 'src', 'assets', 'music-list.js');

// 读取音乐列表
function readMusicList() {
  const content = fs.readFileSync(musicListFile, 'utf8');
  const match = content.match(/export const musicList = \[(.*?)\];/s);
  if (match) {
    const songs = [];
    const songMatches = match[1].match(/\{[^}]*\}/g);
    if (songMatches) {
      songMatches.forEach(songStr => {
        // 提取各个属性，处理包含单引号的情况
        const nameMatch = songStr.match(/name:\s*'(.*?)'(?=,|\s*\})/);
        const artistMatch = songStr.match(/artist:\s*'(.*?)'(?=,|\s*\})/);
        const durationMatch = songStr.match(/duration:\s*'(.*?)'(?=,|\s*\})/);
        const fileMatch = songStr.match(/file:\s*'(.*?)'(?=,|\s*\})/);
        
        if (nameMatch && fileMatch) {
          // 去除文件名中的转义字符
          let actualFile = fileMatch[1];
          // 处理转义的单引号
          actualFile = actualFile.replace(/\\'/g, "'");
          // 处理可能的双重转义
          actualFile = actualFile.replace(/\\\\'/g, "'");
          songs.push({
            name: nameMatch[1],
            artist: artistMatch ? artistMatch[1] : '',
            duration: durationMatch ? durationMatch[1] : '00:00',
            file: actualFile
          });
        }
      });
    }
    return songs;
  }
  return [];
}

// 写入音乐列表
function writeMusicList(musicList) {
  const content = `export const musicList = [
${musicList.map(song => {
  // 处理文件名中的单引号
  const safeFile = song.file.replace(/'/g, "\\'");
  const safeName = song.name.replace(/'/g, "\\'");
  const safeArtist = song.artist.replace(/'/g, "\\'");
  return `  { name: '${safeName}', artist: '${safeArtist}', duration: '${song.duration}', file: '${safeFile}' }`;
}).join(',\n')}
];
`;
  fs.writeFileSync(musicListFile, content, 'utf8');
  console.log('音乐列表已更新');
}

// 格式化时长
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 获取音乐文件时长
async function getMusicDurations() {
  try {
    const musicList = readMusicList();
    const updatedList = [];
    
    console.log('开始获取音乐文件时长...');
    
    for (const song of musicList) {
      try {
        // 使用path.resolve构建绝对路径，确保正确处理包含单引号的文件名
        const filePath = path.resolve(musicDir, song.file);
        console.log(`检查文件: ${filePath}`);
        
        // 直接使用mm.parseFile，让它处理路径问题
        try {
          const metadata = await mm.parseFile(filePath);
          const duration = metadata.format.duration || 0;
          const formattedDuration = formatDuration(duration);
          
          updatedList.push({
            ...song,
            duration: formattedDuration
          });
          
          console.log(`${song.name}: ${formattedDuration}`);
        } catch (parseError) {
          console.log(`${song.name}: 文件解析错误 - ${parseError.message}`);
          updatedList.push(song);
        }
      } catch (error) {
        console.log(`${song.name}: 错误 - ${error.message}`);
        updatedList.push(song);
      }
    }
    
    writeMusicList(updatedList);
    console.log('完成获取音乐文件时长');
  } catch (error) {
    console.error('错误:', error);
  }
}

// 检查是否安装了music-metadata
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'music-metadata'))) {
  console.log('请先安装music-metadata: npm install music-metadata');
  process.exit(1);
}

getMusicDurations();
