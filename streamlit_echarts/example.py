from streamlit_echarts import st_echarts
import streamlit as st


def create_chart():
    # 示例数据和符号大小
    data = [[0, 5.0392866134643555, '_'], [1, 5.067362308502197, '_'], [2, 5.051149845123291, '_'],
            [3, 5.074381351470947, '_'], [4, 5.067855358123779, '_'], [5, 5.002144813537598, '你1'],
            [6, 5.013886451721191, '你2'], [7, 4.801637649536133, '你3'], [8, 4.826063632965088, '你4'],
            [9, 4.818928241729736, '你5'], [10, 4.804053783416748, '你6'], [11, 4.786162376403809, '你7'],
            [12, 4.770969390869141, '你8'], [13, 4.766260623931885, '你9'], [14, 4.778677940368652, '你10'],
            [15, 4.984428882598877, '你11'], [16, 4.967597484588623, '_'], [17, 4.985897064208984, '_'],
            [18, 4.985191345214844, '好1'], [19, 4.958279609680176, '好2'], [20, 4.945309638977051, '好3'],
            [21, 4.974883079528809, '好4'], [22, 4.942062854766846, '好5'], [23, 4.963807106018066, '好6'],
            [24, 4.993961334228516, '好7'], [25, 4.853194236755371, '好8'], [26, 4.847049236297607, '好9'],
            [27, 4.875098705291748, '好10'], [28, 4.698546409606934, '好11'], [29, 4.744611740112305, '好12'],
            [30, 4.720442295074463, '好13'], [31, 4.749125957489014, '好14'], [32, 4.722949981689453, '_'],
            [33, 4.751408100128174, '_'], [34, 4.905649662017822, '啊1'], [35, 4.874714374542236, '啊2'],
            [36, 4.9155755043029785, '啊3'], [37, 4.9977922439575195, '啊4'], [38, 4.9979987144470215, '啊5'],
            [39, 5.024408340454102, '啊6'], [40, 5.013195514678955, '啊7'], [41, 4.92457914352417, '啊8'],
            [42, 4.902719974517822, '_'], [43, 4.898752212524414, '_'], [44, 4.921961784362793, '_'],
            [45, 4.756441593170166, '，1'], [46, 4.717497825622559, '，2'], [47, 4.725845813751221, '，3'],
            [48, 4.942790508270264, '，4'], [49, 4.939827919006348, '_'], [50, 4.923099517822266, '朋1'],
            [51, 4.9250030517578125, '朋2'], [52, 4.934697151184082, '朋3'], [53, 4.89700174331665, '朋4'],
            [54, 4.914496898651123, '朋5'], [55, 4.915477275848389, '朋6'], [56, 4.906345844268799, '朋7'],
            [57, 4.872012138366699, '朋8'], [58, 4.903228282928467, '朋9'], [59, 4.870419502258301, '朋10'],
            [60, 4.71708869934082, '朋11'], [61, 4.706654071807861, '朋12'], [62, 4.716538906097412, '朋13'],
            [63, 4.59032678604126, '朋14'], [64, 4.594047546386719, '朋15'], [65, 4.6069793701171875, '朋16'],
            [66, 4.6130828857421875, '朋17'], [67, 4.624630928039551, '_'], [68, 4.642641067504883, '友1'],
            [69, 4.599527359008789, '友2'], [70, 4.625556945800781, '友3'], [71, 4.674103260040283, '友4'],
            [72, 4.6788225173950195, '友5'], [73, 4.699718952178955, '友6'], [74, 4.7213335037231445, '友7'],
            [75, 4.769162178039551, '友8'], [76, 4.7580695152282715, '友9'], [77, 4.717520236968994, '友10'],
            [78, 4.773777008056641, '友11'], [79, 4.786622524261475, '友12'], [80, 4.77076530456543, '友13'],
            [81, 4.779477119445801, '友14'], [82, 4.995537757873535, '友15'], [83, 4.981017589569092, '_'],
            [84, 4.942055702209473, '_'], [85, 5.072439193725586, '。1'], [86, 4.993990421295166, '。2'],
            [87, 5.029709815979004, '。3'], [88, 5.076859951019287, '。4'], [89, 5.039123058319092, '_'],
            [90, 5.039204120635986, '_'], [91, 5.082521915435791, '_'], [92, 5.084317684173584, '_'],
            [93, 5.0900983810424805, '_'], [94, 5.07602071762085, '_'], [95, 5.120644569396973, '_'],
            [96, 5.096180438995361, '_'], [97, 5.11968994140625, '_'], [98, 5.123868465423584, '_'],
            [99, 5.123959064483643, '_']]  # 示例数据
    # data = [10,15,23,29,36]  # 示例数据
    x_data = []

    for i in range(len(data)):
        x_data.append(data[i][2])

    options = {
        'tooltip': {
            'triggerOn': "none",
            'formatter': '--x_x--0_0--function (params) { return params.seriesName +"<br>" + params.name +": " '
                         '+params.data[1].toFixed(2)}--x_x--0_0--'
        },
        'grid': {

            'left': '3%',
            'right': '4%',
        },

        "xAxis": {
            # "scale": True,
            "type": "category",
            'boundaryGap': 'false',
            # "data": x_data,
            'data': ['0_', '1ni2[你]', '2_', '3hao6[好]', '4_', '5a5[啊]', '6_', '7，[，]', '8_', '9peng2[朋]', '10_',
                     '11iou5[友]', '12_', '13。[。]', '14_'],
            'axisLine': {'onZero': 'false'},
        },
        "yAxis": {
            # "scale": True,
            "type": "value",

        },
        'visualMap': {
            'type': 'piecewise',
            'show': 'false',
            'dimension': 0,
            'seriesIndex': 0,
            'pieces': [
                # {
                #     'gt': 1,
                #     'lt': 3,
                #     'color': 'rgba(180, 180, 180, 0.4)'
                # },
                # {
                #     'gt': 4,
                #     'lt': 5,
                #     'color': 'rgba(234, 56, 18, 0.4)'
                # }
            ]
        },
        "series": [{
            'id': 'line1',
            'name': '音高',
            "draggable": "true",
            "type": "line",
            'symbolSize': 6,
            'origin_symbolSize': 3,
            'smooth': 'true',
            'itemStyle': {
                'color': '#4371ec',
                'opacity': 0.5
            },
            'originItemStyle': {
                'color': 'blue',
                'opacity': 1
            },

            'lineStyle': {
                'color': '#5470C6',
                'width': 5
            },
            'areaStyle': {},
            'data': [[0, 0.9055825471878052], [1, 0.8982847929000854], [2, 0.9017429735660553],
                     [3, 0.8966277837753296], [4, 0.8751828074455261], [5, 0.8992016911506653], [6, 0.8961976170539856],
                     [7, 0.9060178399085999], [8, 0.902618408203125], [9, 0.8879055976867676], [10, 0.8599608540534973],
                     [11, 0.8834148049354553], [12, 0.9018626809120178], [13, 0.909054696559906],
                     [14, 0.9035203456878662]],
            'sourceData': [[0, 0.9055825471878052], [1, 0.8982847929000854], [2, 0.9182042479515076],
                           [3, 0.8966277837753296], [4, 0.8751828074455261], [5, 0.8992016911506653],
                           [6, 0.8961976170539856], [7, 0.9060178399085999], [8, 0.902618408203125],
                           [9, 0.8879055976867676], [10, 0.8599608540534973], [11, 0.8834148049354553],
                           [12, 0.9018626809120178], [13, 0.909054696559906], [14, 0.9035203456878662]]}],
        'listeningDataZoom': 'true',  # 如果这个数据需要拐点进行拖拽,而且设置了dataZoom,那么需要设置这个参数为true
        'dataZoom': [{'type': 'slider', 'start': 0, 'end': 100, 'showDetail': True, 'realtime': False}],

    }
    return options


# Streamlit 主函数
def main():
    # st.title('ECharts in Streamlit')

    chart_options = create_chart()
    events = {
        # "click":"function(params) { return [params.type, params.name, params.value] }",
    }
    if 'st_echarts' not in st.session_state:
        st.session_state['st_echarts'] = None
    # value =  st_echarts(options=chart_options, height="400px")
    if st.session_state['st_echarts'] is not None:
        print('----')
        print(st.session_state['st_echarts'])
        print('----')
        # chart_options['series'][0]['data'] = st.session_state['st_echarts'][0]['data']
        chart_options = st.session_state['st_echarts']

    st_echarts(key='st_echarts', options=chart_options, height="400px")


if __name__ == "__main__":
    main()
